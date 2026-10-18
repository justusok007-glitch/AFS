import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  BellRing,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Hash,
  Wallet,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import {
  currentMonth,
  subscribeToClock,
  today,
} from '../../../domain/clock';
import {
  formatRupees,
  formatSchoolDate,
} from '../../../domain/formatters/SchoolFormatters';
import {
  FeeVoucher,
  ParentAttendanceSummary,
  Profile,
  SchoolClass,
  Section,
  Student,
  StudentFeeSummary,
  VoucherStatus,
} from '../../../domain/models/models';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
  StatusChip,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AttendanceProgressRing,
  AttendanceStatusBadge,
  formatYearMonthLabel,
  PullToRefreshContainer,
} from './ParentHelpers';

export interface ParentHomeTabProps {
  parentProfile: Profile;
  selectedChild: Student;
  schoolClass?: SchoolClass;
  section?: Section;
  onOpenFeesTab: () => void;
}

export const ParentHomeTab: React.FC<ParentHomeTabProps> = ({
  parentProfile,
  selectedChild,
  schoolClass,
  section,
  onOpenFeesTab,
}) => {
  const { stringResource, language } = useStringResource();

  const [todayDate, setTodayDate] = useState<string>(() => today());
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [attendanceSummary, setAttendanceSummary] =
    useState<ParentAttendanceSummary | null>(null);
  const [feeSummary, setFeeSummary] = useState<StudentFeeSummary | null>(null);
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);

  useEffect(() => {
    return subscribeToClock(() => {
      setTodayDate(today());
    });
  }, []);

  const loadChildHomeData = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const curMonth = currentMonth();
        setTodayDate(today());
        const [attRes, feeSumRes, vouchersRes] = await Promise.all([
          AppModule.attendanceRepository.getParentSummary(
            selectedChild.id,
            curMonth
          ),
          AppModule.feeRepository.feeSummaryForStudent(selectedChild.id),
          AppModule.feeRepository.getVouchersForStudent(selectedChild.id),
        ]);

        if (!attRes.ok) {
          setErrorMessage(attRes.error.message);
          return;
        }
        if (!feeSumRes.ok) {
          setErrorMessage(feeSumRes.error.message);
          return;
        }
        if (!vouchersRes.ok) {
          setErrorMessage(vouchersRes.error.message);
          return;
        }

        setAttendanceSummary(attRes.data);
        setFeeSummary(feeSumRes.data);
        setVouchers(vouchersRes.data);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unexpected error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedChild.id]
  );

  useEffect(() => {
    loadChildHomeData(false);
  }, [loadChildHomeData, todayDate]);

  const classSectionText = (() => {
    const className = schoolClass
      ? language === 'ur'
        ? schoolClass.nameUr
        : schoolClass.nameEn
      : selectedChild.sectionId;
    const secName = section ? `-${section.name}` : '';
    return `${className}${secName}`;
  })();

  const campusText =
    selectedChild.campusId === 'campus_b'
      ? stringResource('campus_boys')
      : stringResource('campus_girls');

  if (loading) {
    return (
      <div className="space-y-3.5">
        <ShimmerPlaceholder lines={2} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
        <ShimmerPlaceholder lines={4} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title={stringResource('error_loading_title')}
        subtitle={stringResource('error_loading_subtitle')}
        actionLabel={stringResource('retry_button')}
        onAction={() => loadChildHomeData(false)}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  const activeMonth = todayDate.slice(0, 7);

  // Today's attendance record (from repository dailyRecords for today())
  const todayRecord =
    attendanceSummary?.dailyRecords.find((r) => r.date === todayDate) ?? null;

  // This month's attendance entry from repository monthlyPercentages
  const thisMonthEntry =
    attendanceSummary?.monthlyPercentages.find(
      (m) => m.month === activeMonth
    ) ?? null;

  const thisMonthPercentage = thisMonthEntry?.percentage ?? 0;

  // Oldest unpaid voucher (vouchers are returned newest-first, so sort ascending by billingMonth/dueDate)
  const unpaidVouchersOldestFirst = vouchers
    .filter((v) => v.status !== VoucherStatus.PAID)
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const oldestUnpaidVoucher = unpaidVouchersOldestFirst[0] ?? null;

  const pendingAmount = feeSummary?.pending ?? 0;

  return (
    <PullToRefreshContainer
      refreshing={refreshing}
      onRefresh={() => loadChildHomeData(true)}
    >
      {/* 1. Greeting with Parent's Name */}
      <SchoolCard className="space-y-1 bg-white">
        <div className="text-xs font-semibold text-[#F28C28]">
          {stringResource('parent_greeting_prefix')}
        </div>
        <h2 className="font-heading text-lg font-bold text-[#14284B]">
          {language === 'ur'
            ? parentProfile.fullNameUr
            : parentProfile.fullName}
        </h2>
        <p className="text-xs text-[#6B7385]">
          {stringResource('parent_welcome_subtitle')}
        </p>
      </SchoolCard>

      {/* 2. Child Profile Card (Name, Class-Section, Campus, Admission No, Roll No) */}
      <SchoolCard className="space-y-3 border-s-4 border-s-[#F28C28]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#6B7385]">
              {stringResource('child_profile_card_title')}
            </div>
            <h3 className="font-heading text-base font-bold text-[#14284B] mt-0.5">
              {language === 'ur' ? selectedChild.nameUr : selectedChild.name}
            </h3>
          </div>
          <span
            dir="ltr"
            className="px-2.5 py-1 rounded-xl bg-[#14284B]/8 text-[#14284B] font-mono text-xs font-bold shrink-0"
          >
            {selectedChild.admissionNo}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E4E8F0]">
          <div className="bg-[#F6F8FC] rounded-xl p-2.5 border border-[#E4E8F0]">
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#6B7385]">
              <GraduationCap className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
              <span className="truncate">
                {stringResource('child_class_section_label')}
              </span>
            </div>
            <div className="font-heading text-xs font-bold text-[#14284B] mt-1 truncate">
              {classSectionText}
            </div>
          </div>

          <div className="bg-[#F6F8FC] rounded-xl p-2.5 border border-[#E4E8F0]">
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#6B7385]">
              <Building2 className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
              <span className="truncate">
                {stringResource('child_campus_label')}
              </span>
            </div>
            <div className="font-heading text-xs font-bold text-[#14284B] mt-1 truncate">
              {campusText}
            </div>
          </div>

          <div className="bg-[#F6F8FC] rounded-xl p-2.5 border border-[#E4E8F0]">
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#6B7385]">
              <Hash className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
              <span className="truncate">
                {stringResource('child_roll_no_label')}
              </span>
            </div>
            <div
              dir="ltr"
              className="font-heading text-xs font-bold text-[#14284B] mt-1 text-start tabular-nums"
            >
              {stringResource('child_roll_prefix')}
              {selectedChild.rollNo}
            </div>
          </div>
        </div>
      </SchoolCard>

      {/* 3. Today's Attendance Status + This Month's Attendance Ring */}
      <SchoolCard className="space-y-4">
        {/* Today's Attendance Row */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E8F0]">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 font-heading text-xs font-bold text-[#14284B]">
              <CalendarCheck className="w-4 h-4 text-[#F28C28] shrink-0" />
              <span>{stringResource('home_today_attendance_title')}</span>
            </div>
            <div dir="ltr" className="text-[11px] font-mono text-[#6B7385]">
              {formatSchoolDate(todayDate)}
            </div>
          </div>
          <AttendanceStatusBadge status={todayRecord?.status ?? null} />
        </div>

        {/* This Month's Attendance Ring + Counts */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div>
              <div className="font-heading text-xs font-bold text-[#14284B]">
                {stringResource('home_month_attendance_title')}
              </div>
              <div className="text-[11px] text-[#6B7385]">
                {formatYearMonthLabel(activeMonth, stringResource)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="px-2.5 py-1.5 rounded-xl bg-[#2E9E5B]/10 text-[#2E9E5B] font-semibold flex items-center justify-between">
                <span>{stringResource('att_status_present')}</span>
                <span dir="ltr" className="font-mono font-bold">
                  {thisMonthEntry?.presentDays ?? 0}
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-[#D64545]/10 text-[#D64545] font-semibold flex items-center justify-between">
                <span>{stringResource('att_status_absent')}</span>
                <span dir="ltr" className="font-mono font-bold">
                  {thisMonthEntry?.absentDays ?? 0}
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-[#2F80ED]/10 text-[#2F80ED] font-semibold flex items-center justify-between">
                <span>{stringResource('att_status_leave')}</span>
                <span dir="ltr" className="font-mono font-bold">
                  {thisMonthEntry?.leaveDays ?? 0}
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-[#F2B705]/15 text-[#9E7400] font-semibold flex items-center justify-between">
                <span>{stringResource('att_status_late')}</span>
                <span dir="ltr" className="font-mono font-bold">
                  {thisMonthEntry?.lateDays ?? 0}
                </span>
              </div>
            </div>
          </div>

          <AttendanceProgressRing
            percentage={thisMonthPercentage}
            size={104}
            strokeWidth={9}
            subtitle={formatYearMonthLabel(activeMonth, stringResource, true)}
          />
        </div>
      </SchoolCard>

      {/* 4. Fee Status Card */}
      <SchoolCard className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
            <Wallet className="w-4 h-4 text-[#F28C28]" />
            <span>{stringResource('home_fee_status_title')}</span>
          </div>
          {pendingAmount > 0 ? (
            <StatusChip
              label={stringResource('voucher_status_unpaid')}
              tone="warning"
            />
          ) : (
            <StatusChip
              label={stringResource('home_fee_all_paid_title')}
              tone="success"
            />
          )}
        </div>

        {pendingAmount > 0 ? (
          <div className="p-3.5 rounded-2xl bg-[#F28C28]/8 border border-[#F28C28]/25 flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#6B7385]">
                {stringResource('home_fee_pending_label')}
              </div>
              <div
                dir="ltr"
                className="font-heading text-2xl font-bold text-[#F28C28] tabular-nums text-start"
              >
                {formatRupees(pendingAmount)}
              </div>
            </div>

            {oldestUnpaidVoucher && (
              <div className="text-end space-y-0.5">
                <div className="text-[11px] font-medium text-[#6B7385]">
                  {stringResource('home_fee_oldest_due_label')}
                </div>
                <div
                  dir="ltr"
                  className="text-xs font-mono font-bold text-[#14284B]"
                >
                  {formatSchoolDate(oldestUnpaidVoucher.dueDate)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#2E9E5B]/10 border border-[#2E9E5B]/25 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E9E5B] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading text-sm font-bold text-[#2E9E5B]">
                {stringResource('home_fee_all_paid_title')}
              </div>
              <p className="text-xs text-[#6B7385]">
                {stringResource('home_fee_all_paid_subtitle')}
              </p>
            </div>
          </div>
        )}

        <PrimaryButton
          text={stringResource('home_fee_view_button')}
          onClick={onOpenFeesTab}
          variant="orange"
          icon={<Wallet className="w-4 h-4" />}
        />
      </SchoolCard>

      {/* 5. Placeholder Cards: "Latest result" & "Latest notices" with "Coming soon" */}
      <div className="grid grid-cols-1 gap-3.5">
        <SchoolCard className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
              <Award className="w-4 h-4 text-[#F28C28]" />
              <span>{stringResource('home_latest_result_title')}</span>
            </div>
            <StatusChip
              label={stringResource('coming_soon_title')}
              tone="info"
            />
          </div>
          <p className="text-xs text-[#6B7385] leading-relaxed">
            {stringResource('home_latest_result_subtitle')}
          </p>
        </SchoolCard>

        <SchoolCard className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
              <BellRing className="w-4 h-4 text-[#F28C28]" />
              <span>{stringResource('home_latest_notices_title')}</span>
            </div>
            <StatusChip
              label={stringResource('coming_soon_title')}
              tone="info"
            />
          </div>
          <p className="text-xs text-[#6B7385] leading-relaxed">
            {stringResource('home_latest_notices_subtitle')}
          </p>
        </SchoolCard>
      </div>
    </PullToRefreshContainer>
  );
};
