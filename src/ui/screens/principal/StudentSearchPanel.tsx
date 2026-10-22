import { useBackHandler } from '../../navigation/backStack';
import React, { useEffect, useState } from 'react';
import { Phone, Search } from 'lucide-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import { ParentAttendanceSummary, Profile, Student, StudentFeeSummary } from '../../../domain/models/models';
import { SchoolCard, SchoolTextField, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups, FeeSummaryCards, StudentNameBlock, studentClassLabel } from '../accountant/AccountantShared';
import { ParentAttendanceTab } from '../parent/ParentAttendanceTab';
import { ParentResultsTab } from '../parent/ParentResultsTab';

/** Student search; opening a student shows details, attendance calendar, fees and results (read-only). */
export const StudentSearchPanel: React.FC<{ user: Profile; lookups: AccountantLookups }> = ({ user, lookups }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  // student search + profile
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
  const [profile, setProfile] = useState<Student | null>(null);
  useBackHandler(!!profile, () => setProfile(null));
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
            <ParentResultsTab parent={user} child={profile} />
          </>
        )}
      </div>
    );
  }

  return (
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
  );
};
