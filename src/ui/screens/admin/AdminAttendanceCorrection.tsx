import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import { AttendanceRecord, AttendanceStatus, Profile, Student } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { selectCls } from '../principal/PrincipalShared';

const STATUS_KEY: Record<AttendanceStatus, StringKey> = {
  [AttendanceStatus.PRESENT]: 'att_status_present',
  [AttendanceStatus.ABSENT]: 'att_status_absent',
  [AttendanceStatus.LEAVE]: 'att_status_leave',
  [AttendanceStatus.LATE]: 'att_status_late',
};

const TONE: Record<AttendanceStatus, 'success' | 'error' | 'info' | 'warning'> = {
  [AttendanceStatus.PRESENT]: 'success',
  [AttendanceStatus.ABSENT]: 'error',
  [AttendanceStatus.LEAVE]: 'info',
  [AttendanceStatus.LATE]: 'warning',
};

/** Admin-only: change any student's attendance for any past date. Reason is mandatory and audited. */
export const AdminAttendanceCorrection: React.FC<{
  admin: Profile;
  sectionOptions: { id: string; label: string }[];
  onBack: () => void;
}> = ({ admin, sectionOptions, onBack }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(today());
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(false);

  const load = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    setFailed(false);
    const [st, rec] = await Promise.all([
      AppModule.attendanceRepository.studentsOfSection(sectionId),
      AppModule.attendanceRepository.getForSectionAndDate(sectionId, date),
    ]);
    if (!st.ok || !rec.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setStudents(st.data);
    const m: Record<string, AttendanceRecord> = {};
    rec.data.forEach((r) => (m[r.studentId] = r));
    setRecords(m);
    setLoading(false);
  }, [sectionId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (s: Student) => {
    setEditing(s);
    setStatus(records[s.id]?.status ?? AttendanceStatus.PRESENT);
    setReason('');
    setError(null);
    setNotice(false);
  };

  const save = async () => {
    if (!editing) return;
    if (!reason.trim()) return setError(t('st_err_reason'));
    setBusy(true);
    setError(null);
    const r = await AppModule.attendanceRepository.adminCorrect(admin, editing.id, sectionId, date, status, reason);
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setEditing(null);
    setNotice(true);
    void load();
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('ad_att_close')}</span>
      </button>
      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('ad_att_title')}</h3>
        <select className={selectCls} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">{t('ad_att_pick')}</option>
          {sectionOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
        </select>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">{t('ad_att_date')}</label>
          <input type="date" dir="ltr" className={selectCls} value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
        </div>
        {notice && <p className="text-xs font-semibold text-[#2E9E5B]">{t('ad_att_done')}</p>}
      </SchoolCard>

      {editing && (
        <SchoolCard className="space-y-2.5 border-[#F28C28]">
          <div className="text-sm font-bold text-[#14284B]">{editing.name} <span className="font-urdu" dir="rtl">{editing.nameUr}</span></div>
          <TabRow
            tabs={[AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LEAVE, AttendanceStatus.LATE].map((s) => ({ id: s, label: t(STATUS_KEY[s]) }))}
            selected={status}
            onSelect={setStatus}
          />
          <SchoolTextField label={t('ad_reason_label')} value={reason} onValueChange={setReason} errorText={error ?? undefined} />
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={() => setEditing(null)} />
            <PrimaryButton text={t('ad_att_save')} variant="orange" loading={busy} onClick={() => void save()} />
          </div>
        </SchoolCard>
      )}

      {!sectionId ? null : loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : students.length === 0 ? (
        <EmptyState title={t('ad_att_none')} description="" />
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const rec = records[s.id];
            return (
              <SchoolCard key={s.id} className="p-3 flex items-center justify-between gap-2" onClick={() => open(s)}>
                <div className="min-w-0 text-sm">
                  <span dir="ltr" className="font-mono text-[11px] text-[#6B7385] me-2">{s.rollNo}</span>
                  <b>{s.name}</b>
                </div>
                {rec ? <StatusChip label={t(STATUS_KEY[rec.status])} tone={TONE[rec.status]} /> : <StatusChip label={t('ad_att_unmarked')} tone="info" />}
              </SchoolCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
