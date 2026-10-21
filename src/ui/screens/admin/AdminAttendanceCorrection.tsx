import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { fetchStudentMonth } from '../../../data/supabase/sync';
import { checkWeeklyOffOrHoliday, today } from '../../../domain/clock';
import { AttendanceStatus, DayOfWeek, Profile, SchoolHoliday, Student } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard, ShimmerPlaceholder, TabRow } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { useAccountantLookups } from '../accountant/AccountantShared';
import { selectCls } from '../principal/PrincipalShared';
import { TeacherAttendanceTab } from '../teacher/TeacherAttendanceTab';

type Mode = 'submit' | 'student';

const COLORS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-[#2E9E5B] text-white',
  [AttendanceStatus.ABSENT]: 'bg-[#D64545] text-white',
  [AttendanceStatus.LEAVE]: 'bg-[#2F80ED] text-white',
  [AttendanceStatus.LATE]: 'bg-[#F2B705] text-[#1B2233]',
};
const LETTER: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'P',
  [AttendanceStatus.ABSENT]: 'A',
  [AttendanceStatus.LEAVE]: 'Le',
  [AttendanceStatus.LATE]: 'L',
};

/** Admin attendance: (1) submit a class like the attendance coordinator, (2) mark one student at a time on a month calendar. */
export const AdminAttendanceCorrection: React.FC<{
  admin: Profile;
  sectionOptions: { id: string; label: string }[];
  onBack: () => void;
}> = ({ admin, sectionOptions, onBack }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const lookups = useAccountantLookups();
  const [mode, setMode] = useState<Mode>('submit');
  const [sectionId, setSectionId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('back_button_label')}</span>
      </button>
      <TabRow
        tabs={[
          { id: 'submit' as Mode, label: t('adatt_submit_tab') },
          { id: 'student' as Mode, label: t('adatt_student_tab') },
        ]}
        selected={mode}
        onSelect={setMode}
      />
      {mode === 'submit' ? (
        lookups.loading ? (
          <ShimmerPlaceholder lines={4} showHeader />
        ) : (
          <TeacherAttendanceTab
            teacherProfile={admin}
            classesMap={lookups.classesMap}
            selectedSectionId={sectionId}
            onSelectSectionId={setSectionId}
            onDirtyChange={() => {}}
          />
        )
      ) : (
        <StudentCalendar admin={admin} sectionOptions={sectionOptions} />
      )}
    </div>
  );
};

const pad = (n: number) => String(n).padStart(2, '0');

const StudentCalendar: React.FC<{ admin: Profile; sectionOptions: { id: string; label: string }[] }> = ({ admin, sectionOptions }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const [sectionId, setSectionId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [idx, setIdx] = useState(0);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [weeklyOff, setWeeklyOff] = useState<DayOfWeek[]>([]);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;
  const student = students[idx] ?? null;
  const todayStr = today();

  useEffect(() => {
    if (!sectionId) {
      setStudents([]);
      return;
    }
    void AppModule.attendanceRepository.studentsOfSection(sectionId).then((r) => {
      setStudents(r.ok ? r.data : []);
      setIdx(0);
    });
  }, [sectionId]);

  const loadMarks = useCallback(async () => {
    if (!student) return setMarks({});
    setLoading(true);
    try {
      await fetchStudentMonth(student.id, month);
    } catch {
      /* offline: use what is stored */
    }
    const [sum, set, hol] = await Promise.all([
      AppModule.attendanceRepository.getParentSummary(student.id, month),
      AppModule.settingsRepository.getSchoolSettings(),
      AppModule.settingsRepository.getHolidays(Number(month.slice(0, 4)), student.campusId),
    ]);
    const m: Record<string, AttendanceStatus> = {};
    if (sum.ok) sum.data.dailyRecords.forEach((r) => (m[r.date] = r.status));
    setMarks(m);
    if (set.ok && set.data.weeklyOffDays) setWeeklyOff(set.data.weeklyOffDays);
    if (hol.ok) setHolidays(hol.data);
    setLoading(false);
  }, [student, month]);
  useEffect(() => {
    void loadMarks();
  }, [loadMarks]);

  const [y, mo] = month.split('-').map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const firstDow = (new Date(y, mo - 1, 1).getDay() + 6) % 7; // Monday first
  const dates = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => `${month}-${pad(i + 1)}`), [month, daysInMonth]);
  const isOff = (d: string) => (student ? checkWeeklyOffOrHoliday(d, holidays, weeklyOff, student.campusId).isOff : false);
  const workDays = dates.filter((d) => d <= todayStr && !isOff(d));

  const save = async (changes: { date: string; status: AttendanceStatus | null }[]) => {
    if (!student || changes.length === 0) return;
    setErr(null);
    const prev = marks;
    setMarks((cur) => {
      const n = { ...cur };
      changes.forEach((c) => { if (c.status) n[c.date] = c.status; else delete n[c.date]; });
      return n;
    });
    const r = await AppModule.attendanceRepository.adminMarkStudentDays(admin, student.id, changes);
    if (!r.ok) {
      setMarks(prev);
      setErr(r.error.message);
    }
  };

  const cycle = (d: string) => {
    const cur = marks[d];
    const next = !cur ? AttendanceStatus.PRESENT : cur === AttendanceStatus.PRESENT ? AttendanceStatus.ABSENT : cur === AttendanceStatus.ABSENT ? AttendanceStatus.LEAVE : AttendanceStatus.PRESENT;
    void save([{ date: d, status: next }]);
  };

  const shiftMonth = (delta: number) => {
    const dt = new Date(y, mo - 1 + delta, 1);
    const m = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`;
    if (m > todayStr.slice(0, 7)) return;
    setMonth(m);
  };

  const count = (s: AttendanceStatus) => dates.filter((d) => marks[d] === s).length;
  const weekdays = language === 'ur' ? ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthTitle = new Date(y, mo - 1, 1).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2">
        <label className="block text-xs font-semibold">{t('ad_unlock_section')}</label>
        <select className={selectCls} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">{t('rs_choose_class')}</option>
          {sectionOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
        </select>
      </SchoolCard>

      {sectionId && students.length === 0 && <p className="text-xs text-[#6B7385] text-center py-4">{t('adatt_no_students')}</p>}

      {student && (
        <SchoolCard className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label="previous student" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="w-11 h-11 rounded-2xl border border-[#E4E8F0] flex items-center justify-center text-[#14284B] disabled:opacity-30 cursor-pointer">
              <Prev className="w-5 h-5" />
            </button>
            <div className="min-w-0 text-center">
              <div className="font-heading text-sm font-bold text-[#14284B] truncate">{language === 'ur' && student.nameUr ? student.nameUr : student.name}</div>
              <div dir="ltr" className="text-[11px] text-[#6B7385]">#{idx + 1} / {students.length} · {student.admissionNo}</div>
            </div>
            <button type="button" aria-label="next student" disabled={idx >= students.length - 1} onClick={() => setIdx(idx + 1)} className="w-11 h-11 rounded-2xl border border-[#E4E8F0] flex items-center justify-center text-[#14284B] disabled:opacity-30 cursor-pointer">
              <Next className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} className="w-9 h-9 rounded-xl border border-[#E4E8F0] flex items-center justify-center cursor-pointer"><Prev className="w-4 h-4" /></button>
            <div className="text-sm font-semibold text-[#14284B]">{monthTitle}</div>
            <button type="button" disabled={month >= todayStr.slice(0, 7)} onClick={() => shiftMonth(1)} className="w-9 h-9 rounded-xl border border-[#E4E8F0] flex items-center justify-center disabled:opacity-30 cursor-pointer"><Next className="w-4 h-4" /></button>
          </div>

          {loading ? (
            <ShimmerPlaceholder lines={5} />
          ) : (
            <div dir="ltr" className="grid grid-cols-7 gap-1.5">
              {weekdays.map((w) => (<div key={w} className="text-center text-[10px] font-semibold text-[#6B7385]">{w}</div>))}
              {Array.from({ length: firstDow }, (_, i) => (<div key={`b${i}`} />))}
              {dates.map((d, i) => {
                const st = marks[d];
                const off = isOff(d);
                const future = d > todayStr;
                const disabled = off || future;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    onClick={() => cycle(d)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold leading-none transition-transform active:scale-90 ${
                      disabled ? 'bg-[#F0F2F7] text-[#B5BBC9]' : st ? COLORS[st] : 'bg-white border border-[#CBD2E0] text-[#14284B]'
                    } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span>{i + 1}</span>
                    {st && !disabled && <span className="text-[9px] font-semibold mt-0.5">{LETTER[st]}</span>}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded-lg bg-[#2E9E5B]/10 text-[#2E9E5B]">{t('att_status_present')} <span dir="ltr">{count(AttendanceStatus.PRESENT)}</span></span>
            <span className="px-2 py-0.5 rounded-lg bg-[#D64545]/10 text-[#D64545]">{t('att_status_absent')} <span dir="ltr">{count(AttendanceStatus.ABSENT)}</span></span>
            <span className="px-2 py-0.5 rounded-lg bg-[#2F80ED]/10 text-[#2F80ED]">{t('att_status_leave')} <span dir="ltr">{count(AttendanceStatus.LEAVE)}</span></span>
            <span className="px-2 py-0.5 rounded-lg bg-[#F2B705]/15 text-[#9E7400]">{t('att_status_late')} <span dir="ltr">{count(AttendanceStatus.LATE)}</span></span>
          </div>
          <p className="text-[11px] text-[#6B7385]">{t('adatt_tap_hint')}</p>
          {err && <p className="text-xs text-[#D64545]">{err}</p>}
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton text={t('adatt_mark_all')} variant="orange" disabled={loading || workDays.length === 0} onClick={() => void save(workDays.map((d) => ({ date: d, status: AttendanceStatus.PRESENT })))} />
            <PrimaryButton text={t('adatt_next_student')} variant="navy" disabled={idx >= students.length - 1} onClick={() => setIdx(idx + 1)} />
          </div>
        </SchoolCard>
      )}
    </div>
  );
};
