import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, LogOut, Settings } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import { DailyFeeImport } from '../admin/DailyFeeImport';
import {
  ClassFeeStructure,
  Profile,
  ConcessionType,
  Student,
  StudentConcession,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  feeHeadName,
  StudentNameBlock,
} from './AccountantShared';

export const AccountantMoreTab: React.FC<{
  actor: Profile;
  lookups: AccountantLookups;
  onOpenSettings: () => void;
  onLogout: () => void;
}> = ({ actor, lookups, onOpenSettings, onLogout }) => {
  const [dailyOpen, setDailyOpen] = useState(false);
  const { stringResource: t, language } = useStringResource();
  const [structures, setStructures] = useState<ClassFeeStructure[]>([]);
  const [concessions, setConcessions] = useState<{ student: Student; items: StudentConcession[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const [fs, st] = await Promise.all([
      AppModule.feeRepository.getClassFeeStructures(null),
      AppModule.studentRepository.search({ query: '', status: null }),
    ]);
    if (!fs.ok || !st.ok) { setFailed(true); setLoading(false); return; }
    const lists = await Promise.all(
      st.data.map(async (s) => {
        const r = await AppModule.feeRepository.getConcessionsForStudent(s.id);
        return { student: s, items: r.ok ? r.data : [] };
      })
    );
    setStructures(fs.data);
    setConcessions(lists.filter((x) => x.items.length > 0));
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const heads = Object.values(lookups.feeHeadsMap).sort((a, b) => a.priority - b.priority);
  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };
  const concessionText = (c: StudentConcession) => {
    const val = c.type === ConcessionType.PERCENT_OFF ? `${c.value}%` : formatRupees(c.value);
    return `${t(`acc_concession_${c.type}` as StringKey)}: ${val}`;
  };

  if (dailyOpen) {
    return <DailyFeeImport actor={actor} onClose={() => { lookups.reload(); setDailyOpen(false); }} />;
  }

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <PrimaryButton text={t('daily_imp_btn')} variant="orange" onClick={() => setDailyOpen(true)} />
        <PrimaryButton text={t('settings_open_from_more')} variant="navy" onClick={onOpenSettings} icon={<Settings className="w-4 h-4 text-[#F28C28]" />} />
        <PrimaryButton text={t('logout_button')} variant="outline" onClick={onLogout} icon={<LogOut className="w-4 h-4 text-[#14284B]" />} />
      </SchoolCard>

      <h2 className="font-heading text-sm font-bold text-[#14284B]">{t('acc_more_structure_title')}</h2>
      <p className="text-[11px] text-[#6B7385]">{t('acc_more_structure_note')}</p>

      {loading || lookups.loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed || lookups.failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { lookups.reload(); void load(); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : (
        <>
          <SchoolCard className="space-y-1.5">
            <h3 className="text-xs font-bold text-[#14284B]">{t('acc_more_heads_heading')}</h3>
            {heads.map((h) => (
              <div key={h.id} className="flex justify-between text-xs">
                <span>{language === 'ur' ? h.nameUr : h.nameEn}</span>
                <span className="text-[#6B7385]">{t(`acc_cat_${h.category}` as StringKey)}</span>
              </div>
            ))}
          </SchoolCard>

          <SchoolCard className="space-y-2">
            <h3 className="text-xs font-bold text-[#14284B]">{t('acc_more_class_fees_heading')}</h3>
            {lookups.classes.map((c) => {
              const rows = structures.filter((s) => s.classId === c.id);
              if (rows.length === 0) return null;
              return (
                <div key={c.id} className="border-t border-[#E4E8F0] pt-1.5 space-y-0.5">
                  <div className="text-xs font-semibold text-[#14284B]">{className(c.id)}</div>
                  {rows.map((r) => (
                    <div key={r.feeHeadId} className="flex justify-between text-xs">
                      <span>
                        {feeHeadName(r.feeHeadId, r.feeHeadId, lookups, language)}
                        {r.chargeMonth ? ` (${t('acc_charged_in_month')} ${t(`month_${String(r.chargeMonth).padStart(2, '0')}` as StringKey)})` : ''}
                      </span>
                      <span dir="ltr" className="font-mono font-bold text-[#14284B]">{formatRupees(r.amount)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </SchoolCard>

          <SchoolCard className="space-y-2">
            <h3 className="text-xs font-bold text-[#14284B]">{t('acc_more_concessions_heading')}</h3>
            {concessions.length === 0 ? (
              <p className="text-xs text-[#6B7385]">{t('acc_more_no_concessions')}</p>
            ) : (
              concessions.map(({ student, items }) => (
                <div key={student.id} className="border-t border-[#E4E8F0] pt-1.5 space-y-0.5">
                  <StudentNameBlock student={student} />
                  {items.map((c) => (
                    <div key={c.feeHeadId} className="text-xs text-[#1B2233]">
                      {feeHeadName(c.feeHeadId, c.feeHeadId, lookups, language)} — {concessionText(c)}
                      {c.reason ? <span className="text-[#6B7385]"> ({t('acc_concession_reason')}: {c.reason})</span> : null}
                    </div>
                  ))}
                </div>
              ))
            )}
          </SchoolCard>
        </>
      )}
    </div>
  );
};
