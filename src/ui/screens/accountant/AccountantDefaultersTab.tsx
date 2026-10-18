import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, MessageCircle, Phone, Users, Wallet } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import { FeeDefaulterSummary } from '../../../domain/models/models';
import { stringsUr } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  downloadCsv,
  interpolate,
  normalizePkPhone,
  StudentNameBlock,
  studentClassLabel,
} from './AccountantShared';

const selectCls =
  'w-full min-h-[44px] px-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] text-sm text-[#14284B]';

export const AccountantDefaultersTab: React.FC<{
  lookups: AccountantLookups;
  /** Omit for read-only use (principal): hides the Receive payment button. */
  onReceivePayment?: (studentId: string) => void;
}> = ({ lookups, onReceivePayment }) => {
  const { stringResource: t, language } = useStringResource();
  const [rows, setRows] = useState<FeeDefaulterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [campus, setCampus] = useState('ALL');
  const [cls, setCls] = useState('ALL');
  const [minMonths, setMinMonths] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const r = await AppModule.feeRepository.getDefaulters(campus === 'ALL' ? null : campus);
    if (!r.ok) { setFailed(true); setLoading(false); return; }
    setRows(r.data);
    setLoading(false);
  }, [campus]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => {
          if (r.monthsUnpaid.length < minMonths) return false;
          if (cls !== 'ALL' && lookups.sectionsMap[r.student.sectionId]?.classId !== cls) return false;
          return true;
        })
        .sort((a, b) => b.amountDue - a.amountDue),
    [rows, cls, minMonths, lookups.sectionsMap]
  );
  const total = filtered.reduce((s, r) => s + r.amountDue, 0);

  const whatsappUrl = (r: FeeDefaulterSummary) => {
    const msg = interpolate(stringsUr.acc_wa_message, {
      child: r.student.nameUr || r.student.name,
      amount: r.amountDue.toLocaleString('en-US'),
      school: lookups.schoolNameUr,
    });
    return `https://wa.me/${normalizePkPhone(r.student.guardianPhone)}?text=${encodeURIComponent(msg)}`;
  };

  const exportCsv = () => {
    downloadCsv('defaulters.csv', [
      ['Admission No', 'Student', 'Father', 'Class', 'Phone', 'Months unpaid', 'Amount due'],
      ...filtered.map((r) => [
        r.student.admissionNo,
        r.student.name,
        r.student.fatherName,
        studentClassLabel(r.student, lookups, 'en'),
        r.student.guardianPhone,
        r.monthsUnpaid.length,
        r.amountDue,
      ]),
    ]);
  };

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <select className={selectCls} value={campus} onChange={(e) => { setCampus(e.target.value); setCls('ALL'); }}>
            <option value="ALL">{t('campus_both')}</option>
            {lookups.campuses.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
          </select>
          <select className={selectCls} value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="ALL">{t('acc_all_classes')}</option>
            {lookups.classes.filter((c) => campus === 'ALL' || c.campusId === campus).map((c) => (
              <option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold">{t('acc_def_min_months')}</span>
          <select className={`${selectCls} !w-24`} value={minMonths} onChange={(e) => setMinMonths(Number(e.target.value))}>
            {[1, 2, 3, 4, 6].map((n) => (<option key={n} value={n}>{n}+</option>))}
          </select>
        </div>
      </SchoolCard>

      {loading || lookups.loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed || lookups.failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { lookups.reload(); void load(); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('acc_def_empty_title')} description={t('acc_def_empty_body')} icon={<Users className="w-6 h-6 text-[#2E9E5B]" />} />
      ) : (
        <>
          <SchoolCard className="p-3 flex items-center justify-between bg-[#D64545]/8">
            <div>
              <div className="text-[11px] font-semibold text-[#6B7385]">{t('acc_def_total_due')}</div>
              <div dir="ltr" className="font-mono text-lg font-bold text-[#D64545] text-start">{formatRupees(total)}</div>
            </div>
            <div className="text-xs text-[#6B7385]"><span dir="ltr" className="font-bold text-[#14284B]">{filtered.length}</span> {t('acc_def_students')}</div>
          </SchoolCard>
          {filtered.map((r) => (
            <SchoolCard key={r.student.id} className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <StudentNameBlock student={r.student} classLabel={studentClassLabel(r.student, lookups, language)} />
                <div className="text-end shrink-0">
                  <div dir="ltr" className="font-mono text-sm font-bold text-[#D64545]">{formatRupees(r.amountDue)}</div>
                  <div className="text-[11px] text-[#6B7385]"><span dir="ltr">{r.monthsUnpaid.length}</span> {t('acc_def_months')}</div>
                </div>
              </div>
              <div className={`grid gap-2 ${onReceivePayment ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <a href={`tel:${r.student.guardianPhone}`} className="min-h-[44px] rounded-xl border border-[#E4E8F0] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#14284B]">
                  <Phone className="w-3.5 h-3.5 text-[#F28C28]" />{t('acc_def_call')}
                </a>
                <a href={whatsappUrl(r)} target="_blank" rel="noopener noreferrer" className="min-h-[44px] rounded-xl border border-[#E4E8F0] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#14284B]">
                  <MessageCircle className="w-3.5 h-3.5 text-[#2E9E5B]" />{t('acc_def_whatsapp')}
                </a>
                {onReceivePayment && (
                <button type="button" onClick={() => onReceivePayment(r.student.id)} className="min-h-[44px] rounded-xl bg-[#F28C28] text-white flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <Wallet className="w-3.5 h-3.5" />{t('acc_receive_payment_btn')}
                </button>
                )}
              </div>
            </SchoolCard>
          ))}
          <PrimaryButton text={t('acc_export_csv_btn')} variant="navy" icon={<Download className="w-4 h-4 text-[#F28C28]" />} onClick={exportCsv} />
        </>
      )}
    </div>
  );
};
