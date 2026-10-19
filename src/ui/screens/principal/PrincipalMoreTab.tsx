import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Bell, ClipboardCheck, GraduationCap, LogOut, MessageSquare, Phone, Search, Settings } from 'lucide-react';
import { HomeTile } from '../../components/HomeTile';
import { AppModule } from '../../../di/AppModule';
import { addDaysIso, today } from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import {
  ParentAttendanceSummary,
  Profile,
  StaffComplianceRow,
  Student,
  StudentFeeSummary,
} from '../../../domain/models/models';
import {
  EmptyState,
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
import { ParentAttendanceTab } from '../parent/ParentAttendanceTab';
import { AccountantDefaultersTab } from '../accountant/AccountantDefaultersTab';
import { MessagesTab } from '../comms/MessagesTab';
import { NoticesCard, NoticesManager } from '../comms/CommsShared';

type Range = 'week' | 'month';
export type MoreView = 'menu' | 'students' | 'compliance' | 'notices' | 'messages' | 'defaulters';

export const PrincipalMoreTab: React.FC<{
  principal: Profile;
  lookups: AccountantLookups;
  view: MoreView;
  onViewChange: (v: MoreView) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}> = ({ principal, lookups, view, onViewChange, onOpenSettings, onLogout }) => {
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
            {profile.dateOfBirth && <div>{t('pr_profile_dob')}: <b dir="ltr">{formatSchoolDate(profile.dateOfBirth)}</b></div>}
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
            <ParentAttendanceTab selectedChild={profile} />
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

  if (view === 'messages') return <MessagesTab user={principal} readOnly onBack={() => onViewChange('menu')} />;
  if (view === 'notices')
    return (
      <div className="space-y-3">
        <NoticesCard user={principal} />
        <NoticesManager actor={principal} lookups={lookups} onBack={() => onViewChange('menu')} />
      </div>
    );

  if (view === 'defaulters') {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => onViewChange('menu')} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
        <AccountantDefaultersTab lookups={lookups} allowExport={false} />
      </div>
    );
  }

  const backBtn = (
    <button type="button" onClick={() => onViewChange('menu')} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
      <BackIcon className="w-4 h-4" />
      <span>{t('back_button_label')}</span>
    </button>
  );
  const ic = 'w-6 h-6';

  if (view === 'menu') {
    return (
      <div className="grid grid-cols-3 gap-3">
        <HomeTile tone="teal" label={t('pr_more_students')} icon={<GraduationCap className={ic} />} onClick={() => onViewChange('students')} />
        <HomeTile tone="red" label={t('tab_defaulters')} icon={<AlertTriangle className={ic} />} onClick={() => onViewChange('defaulters')} />
        <HomeTile tone="indigo" label={t('pr_more_compliance')} icon={<ClipboardCheck className={ic} />} onClick={() => onViewChange('compliance')} />
        <HomeTile tone="pink" label={t('nt_manage_btn')} icon={<Bell className={ic} />} onClick={() => onViewChange('notices')} />
        <HomeTile tone="green" label={t('ms_audit_btn')} icon={<MessageSquare className={ic} />} onClick={() => onViewChange('messages')} />
        <HomeTile tone="blue" label={t('settings_open_from_more')} icon={<Settings className={ic} />} onClick={onOpenSettings} />
        <HomeTile tone="red" label={t('logout_button')} icon={<LogOut className={ic} />} onClick={onLogout} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {backBtn}
      {view === 'students' && (
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
      )}

      {view === 'compliance' && (
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
      )}
    </div>
  );
};
