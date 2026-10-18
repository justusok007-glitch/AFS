import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, LogOut, Phone, Search, Settings } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { addDaysIso, today } from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import {
  ParentAttendanceSummary,
  StaffComplianceRow,
  Student,
  StudentFeeSummary,
} from '../../../domain/models/models';
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
import {
  AccountantLookups,
  FeeSummaryCards,
  StudentNameBlock,
  studentClassLabel,
} from '../accountant/AccountantShared';
import { percentColor } from './PrincipalShared';

type Range = 'week' | 'month';

export const PrincipalMoreTab: React.FC<{
  lookups: AccountantLookups;
  onOpenSettings: () => void;
  onLogout: () => void;
}> = ({ lookups, onOpenSettings, onLogout }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  // compliance
  const [range, setRange] = useState<Range>('month');
  const [rows, setRows] = useState<StaffComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const td = today();
    const from = range === 'week' ? addDaysIso(td, -6) : td.slice(0, 7) + '-01';
    const r = await AppModule.dashboardRepository.getStaffCompliance(null, from, td);
    if (!r.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setRows(r.data);
    setLoading(false);
  }, [range]);
  useEffect(() => {
    void load();
  }, [load]);

  // student search + profile
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
  const [profile, setProfile] = useState<Student | null>(null);
  const [fees, setFees] = useState<StudentFeeSummary | null>(null);
  const [att, setAtt] = useState<ParentAttendanceSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const r = await AppModule.studentRepository.search({ query: q, status: null });
      if (cancelled) return;
      setSearchFailed(!r.ok);
      setResults(r.ok ? r.data.slice(0, 20) : []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const openProfile = async (s: Student) => {
    setProfile(s);
    setFees(null);
    setAtt(null);
    setProfileLoading(true);
    const [f, a] = await Promise.all([
      AppModule.feeRepository.feeSummaryForStudent(s.id),
      AppModule.attendanceRepository.getParentSummary(s.id, today().slice(0, 7)),
    ]);
    setFees(f.ok ? f.data : null);
    setAtt(a.ok ? a.data : null);
    setProfileLoading(false);
  };

  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };

  if (profile) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setProfile(null)} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
        <SchoolCard className="space-y-2">
          <h3 className="text-xs font-bold text-[#6B7385]">{t('pr_profile_title')}</h3>
          <StudentNameBlock student={profile} classLabel={studentClassLabel(profile, lookups, language)} />
          <div className="text-xs space-y-0.5">
            <div>{t('acc_father_label')}: <b>{profile.fatherName}</b></div>
            <div>{t('pr_profile_dob')}: <b dir="ltr">{formatSchoolDate(profile.dateOfBirth)}</b></div>
            <div>{t('pr_profile_admission')}: <b dir="ltr">{formatSchoolDate(profile.admissionDate)}</b></div>
            <div className="flex items-center gap-2">
              <span>{t('pr_profile_phone')}:</span>
              <a href={`tel:${profile.guardianPhone}`} dir="ltr" className="font-bold text-[#14284B] inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#F28C28]" />{profile.guardianPhone}
              </a>
            </div>
          </div>
        </SchoolCard>
        {profileLoading ? (
          <ShimmerPlaceholder lines={3} showHeader />
        ) : (
          <>
            {att && (
              <SchoolCard className="space-y-1.5">
                <h3 className="text-xs font-bold text-[#14284B]">{t('pr_profile_attendance')}</h3>
                <div dir="ltr" className="font-mono text-lg font-bold text-start" style={{ color: percentColor(att.allTimePercentage) }}>{att.allTimePercentage}%</div>
                <div dir="ltr" className="text-[11px] text-[#6B7385]">
                  {att.allTimePresentDays + att.allTimeLateDays}P · {att.allTimeAbsentDays}A · {att.allTimeLeaveDays}L
                </div>
              </SchoolCard>
            )}
            {fees && (
              <>
                <h3 className="text-xs font-bold text-[#14284B]">{t('pr_profile_fees')}</h3>
                <FeeSummaryCards summary={fees} />
              </>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <PrimaryButton text={t('settings_open_from_more')} variant="navy" onClick={onOpenSettings} icon={<Settings className="w-4 h-4 text-[#F28C28]" />} />
        <PrimaryButton text={t('logout_button')} variant="outline" onClick={onLogout} icon={<LogOut className="w-4 h-4 text-[#14284B]" />} />
      </SchoolCard>

      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('pr_more_students')}</h3>
        <SchoolTextField label={t('acc_search_placeholder')} value={query} onValueChange={setQuery} leadingIcon={<Search className="w-4 h-4" />} />
        {searchFailed && <p className="text-xs text-[#D64545]">{t('error_loading_subtitle')}</p>}
        {query.trim().length >= 2 && results.length === 0 && !searchFailed && (
          <p className="text-xs text-[#6B7385]">{t('acc_no_results_title')}</p>
        )}
        {results.map((s) => (
          <button key={s.id} type="button" onClick={() => void openProfile(s)} className="w-full text-start border-t border-[#E4E8F0] pt-2 cursor-pointer">
            <StudentNameBlock student={s} classLabel={studentClassLabel(s, lookups, language)} />
          </button>
        ))}
      </SchoolCard>

      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('pr_more_compliance')}</h3>
        <p className="text-[11px] text-[#6B7385]">{t('pr_more_compliance_hint')}</p>
        <TabRow
          tabs={[
            { id: 'week' as Range, label: t('pr_range_week') },
            { id: 'month' as Range, label: t('pr_range_month') },
          ]}
          selected={range}
          onSelect={setRange}
        />
        {loading || lookups.loading ? (
          <ShimmerPlaceholder lines={3} />
        ) : failed ? (
          <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
        ) : (
          [...rows]
            .sort((a, b) => a.percent - b.percent)
            .map((r) => {
              const names = language === 'ur' ? r.teacherNamesUr : r.teacherNamesEn;
              return (
                <div key={r.sectionId} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-1.5">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#14284B]">{className(r.classId)} - {r.sectionName}</div>
                    <div className="text-[11px] text-[#6B7385] truncate">{names.length ? names.join('، ') : t('pr_no_teacher')}</div>
                    <div dir="ltr" className="text-[10px] text-[#6B7385] text-start">{r.daysMarked}/{r.daysExpected} {t('pr_days_marked')}</div>
                  </div>
                  <StatusChip label={`${r.percent}%`} tone={r.percent >= 90 ? 'success' : r.percent >= 75 ? 'warning' : 'error'} />
                </div>
              );
            })
        )}
      </SchoolCard>

      <p className="text-[11px] text-[#6B7385]">{t('pr_notices_soon')}</p>
    </div>
  );
};
