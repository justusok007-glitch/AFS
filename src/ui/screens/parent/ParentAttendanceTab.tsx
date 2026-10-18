import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppModule } from '../../../di/AppModule';
import {
  currentMonth,
  shiftYearMonth,
  subscribeToClock,
} from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import {
  AttendanceRecord,
  AttendanceStatus,
  ParentAttendanceSummary,
  SchoolHoliday,
  Student,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  SchoolCard,
  ShimmerPlaceholder,
  TabItem,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AttendanceProgressRing,
  AttendanceStatusBadge,
  formatPercentValue,
  formatYearMonthLabel,
  PullToRefreshContainer,
} from './ParentHelpers';
import { MonthAttendanceSummaryCard } from './ParentSummaryCards';

export interface ParentAttendanceTabProps {
  selectedChild: Student;
}

type AttendanceViewMode = 'daily' | 'monthly' | 'all_time';

interface CalendarDayCell {
  dateStr: string;
  dayNumber: number;
  isSunday: boolean;
  holiday: SchoolHoliday | null;
  record: AttendanceRecord | null;
}

function buildMonthCalendarCells(
  yearMonth: string,
  dailyRecords: AttendanceRecord[],
  holidays: SchoolHoliday[],
  campusId: string
): { leadingBlanks: number; days: CalendarDayCell[] } {
  const [yStr, mStr] = yearMonth.split('-');
  const year = Number(yStr);
  const month = Number(mStr); // 1..12

  const firstDayUtc = new Date(Date.UTC(year, month - 1, 1));
  const leadingBlanks = firstDayUtc.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const recordMap: Record<string, AttendanceRecord> = {};
  for (const r of dailyRecords) {
    recordMap[r.date] = r;
  }

  const holidayMap: Record<string, SchoolHoliday> = {};
  for (const h of holidays) {
    if (!h.campusId || h.campusId === campusId) {
      holidayMap[h.date] = h;
    }
  }

  const days: CalendarDayCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayPadded = String(d).padStart(2, '0');
    const dateStr = `${yearMonth}-${dayPadded}`;
    const dow = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    days.push({
      dateStr,
      dayNumber: d,
      isSunday: dow === 0,
      holiday: holidayMap[dateStr] ?? null,
      record: recordMap[dateStr] ?? null,
    });
  }

  return { leadingBlanks, days };
}

export const ParentAttendanceTab: React.FC<ParentAttendanceTabProps> = ({
  selectedChild,
}) => {
  const { stringResource, language, isRtl } = useStringResource();

  const [mode, setMode] = useState<AttendanceViewMode>('daily');
  const [calendarMonth, setCalendarMonth] = useState<string>(() =>
    currentMonth()
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [summary, setSummary] = useState<ParentAttendanceSummary | null>(null);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [selectedDayCell, setSelectedDayCell] =
    useState<CalendarDayCell | null>(null);

  useEffect(() => {
    return subscribeToClock(() => {
      setCalendarMonth(currentMonth());
    });
  }, []);

  const loadAttendanceData = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const [attRes, holRes] = await Promise.all([
          AppModule.attendanceRepository.getParentSummary(
            selectedChild.id,
            calendarMonth
          ),
          AppModule.settingsRepository.getHolidays(
            Number(calendarMonth.slice(0, 4)),
            selectedChild.campusId
          ),
        ]);

        if (!attRes.ok) {
          setErrorMessage(attRes.error.message);
          return;
        }

        setSummary(attRes.data);
        setHolidays(holRes.ok ? holRes.data : []);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unexpected error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedChild.id, calendarMonth]
  );

  useEffect(() => {
    setSelectedDayCell(null);
    loadAttendanceData(false);
  }, [loadAttendanceData]);

  const modeTabs: TabItem<AttendanceViewMode>[] = [
    { value: 'daily', label: stringResource('att_mode_daily') },
    { value: 'monthly', label: stringResource('att_mode_monthly') },
    { value: 'all_time', label: stringResource('att_mode_all_time') },
  ];

  const weekdayKeys: StringKey[] = [
    'weekday_sun',
    'weekday_mon',
    'weekday_tue',
    'weekday_wed',
    'weekday_thu',
    'weekday_fri',
    'weekday_sat',
  ];

  if (loading) {
    return (
      <div className="space-y-3.5">
        <ShimmerPlaceholder lines={2} showHeader />
        <ShimmerPlaceholder lines={5} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
      </div>
    );
  }

  if (errorMessage || !summary) {
    return (
      <EmptyState
        title={stringResource('error_loading_title')}
        subtitle={stringResource('error_loading_subtitle')}
        actionLabel={stringResource('retry_button')}
        onAction={() => loadAttendanceData(false)}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  // Current calendarMonth summary from repository monthlyPercentages
  const monthSummary =
    summary.monthlyPercentages.find((m) => m.month === calendarMonth) ?? null;

  const { leadingBlanks, days } = buildMonthCalendarCells(
    calendarMonth,
    summary.dailyRecords,
    holidays,
    selectedChild.campusId
  );

  const chartData = summary.monthlyPercentages.map((m) => ({
    monthCode: m.month,
    monthLabel: formatYearMonthLabel(m.month, stringResource, true),
    percentage: m.percentage,
    percentageLabel: formatPercentValue(m.percentage),
  }));

  return (
    <PullToRefreshContainer
      refreshing={refreshing}
      onRefresh={() => loadAttendanceData(true)}
    >
      <MonthAttendanceSummaryCard child={selectedChild} />
      {/* Segmented Switch: Daily | Monthly | All time */}
      <SchoolCard className="p-2.5">
        <TabRow
          tabs={modeTabs}
          selected={mode}
          onSelect={(m) => setMode(m)}
        />
      </SchoolCard>

      {/* ==================== 1. DAILY VIEW ==================== */}
      {mode === 'daily' && (
        <div className="space-y-3.5">
          <SchoolCard className="space-y-4">
            {/* Month Header with Previous / Next Month Buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth((prev) => shiftYearMonth(prev, -1))
                }
                aria-label={stringResource('att_prev_month')}
                className="w-9 h-9 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#14284B] hover:bg-[#14284B]/8 active:scale-95 transition-all cursor-pointer"
              >
                {isRtl ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>

              <div className="flex items-center gap-2 font-heading text-sm font-bold text-[#14284B]">
                <Calendar className="w-4 h-4 text-[#F28C28]" />
                <span>
                  {formatYearMonthLabel(calendarMonth, stringResource)}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCalendarMonth((prev) => shiftYearMonth(prev, 1))
                }
                aria-label={stringResource('att_next_month')}
                className="w-9 h-9 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#14284B] hover:bg-[#14284B]/8 active:scale-95 transition-all cursor-pointer"
              >
                {isRtl ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {weekdayKeys.map((wk, idx) => (
                <div
                  key={wk}
                  className={`text-[10px] font-bold py-1 ${
                    idx === 0 ? 'text-[#D64545]' : 'text-[#6B7385]'
                  }`}
                >
                  {stringResource(wk)}
                </div>
              ))}
            </div>

            {/* Month Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlanks }).map((_, idx) => (
                <div key={`blank_${idx}`} className="h-10 rounded-xl" />
              ))}

              {days.map((cell) => {
                const isOffDay = cell.isSunday || Boolean(cell.holiday);
                const status = isOffDay ? null : cell.record?.status ?? null;

                let cellStyle =
                  'bg-white text-[#1B2233] border border-[#E4E8F0] hover:border-[#14284B]/40';
                if (isOffDay) {
                  cellStyle =
                    'bg-[#E4E8F0] text-[#6B7385] border border-[#E4E8F0]';
                } else if (status === AttendanceStatus.PRESENT) {
                  cellStyle =
                    'bg-[#2E9E5B] text-white border border-[#2E9E5B] shadow-2xs';
                } else if (status === AttendanceStatus.ABSENT) {
                  cellStyle =
                    'bg-[#D64545] text-white border border-[#D64545] shadow-2xs';
                } else if (status === AttendanceStatus.LEAVE) {
                  cellStyle =
                    'bg-[#2F80ED] text-white border border-[#2F80ED] shadow-2xs';
                } else if (status === AttendanceStatus.LATE) {
                  cellStyle =
                    'bg-[#F2B705] text-[#1B2233] border border-[#F2B705] shadow-2xs';
                }

                const hasRemark = Boolean(cell.record?.remarks || cell.holiday);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDayCell(cell)}
                    dir="ltr"
                    className={`relative h-10 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer ${cellStyle}`}
                  >
                    <span>{cell.dayNumber}</span>
                    {hasRemark && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          status === AttendanceStatus.LATE ||
                          (!status && isOffDay)
                            ? 'bg-[#14284B]'
                            : status
                            ? 'bg-white'
                            : 'bg-[#F28C28]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend Below */}
            <div className="pt-3 border-t border-[#E4E8F0] space-y-2">
              <div className="text-[11px] font-semibold text-[#6B7385]">
                {stringResource('att_legend_title')}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#2E9E5B] shrink-0" />
                  <span className="truncate">
                    {stringResource('att_status_present')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#D64545] shrink-0" />
                  <span className="truncate">
                    {stringResource('att_status_absent')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#2F80ED] shrink-0" />
                  <span className="truncate">
                    {stringResource('att_status_leave')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#F2B705] shrink-0" />
                  <span className="truncate">
                    {stringResource('att_status_late')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#E4E8F0] border border-[#6B7385]/30 shrink-0" />
                  <span className="truncate">
                    {stringResource('att_status_sunday_holiday')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-white border border-[#E4E8F0] shrink-0" />
                  <span className="truncate">
                    {stringResource('att_status_unmarked_day')}
                  </span>
                </div>
              </div>
            </div>
          </SchoolCard>

          {/* Under the Calendar: That Month's Counts & Month's Percentage */}
          <SchoolCard className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="font-heading text-xs font-bold text-[#14284B]">
                {stringResource('att_month_summary_title')} ·{' '}
                {formatYearMonthLabel(calendarMonth, stringResource)}
              </div>
              <span
                dir="ltr"
                className="px-2.5 py-1 rounded-xl bg-[#14284B] text-white font-heading text-xs font-bold tabular-nums"
              >
                {formatPercentValue(monthSummary?.percentage ?? 0)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-[#2E9E5B]/10 border border-[#2E9E5B]/20 p-2.5">
                <div
                  dir="ltr"
                  className="font-heading text-base font-bold text-[#2E9E5B] tabular-nums"
                >
                  {monthSummary?.presentDays ?? 0}
                </div>
                <div className="text-[10px] font-semibold text-[#2E9E5B] mt-0.5 truncate">
                  {stringResource('att_status_present')}
                </div>
              </div>

              <div className="rounded-xl bg-[#D64545]/10 border border-[#D64545]/20 p-2.5">
                <div
                  dir="ltr"
                  className="font-heading text-base font-bold text-[#D64545] tabular-nums"
                >
                  {monthSummary?.absentDays ?? 0}
                </div>
                <div className="text-[10px] font-semibold text-[#D64545] mt-0.5 truncate">
                  {stringResource('att_status_absent')}
                </div>
              </div>

              <div className="rounded-xl bg-[#2F80ED]/10 border border-[#2F80ED]/20 p-2.5">
                <div
                  dir="ltr"
                  className="font-heading text-base font-bold text-[#2F80ED] tabular-nums"
                >
                  {monthSummary?.leaveDays ?? 0}
                </div>
                <div className="text-[10px] font-semibold text-[#2F80ED] mt-0.5 truncate">
                  {stringResource('att_status_leave')}
                </div>
              </div>

              <div className="rounded-xl bg-[#F2B705]/15 border border-[#F2B705]/30 p-2.5">
                <div
                  dir="ltr"
                  className="font-heading text-base font-bold text-[#9E7400] tabular-nums"
                >
                  {monthSummary?.lateDays ?? 0}
                </div>
                <div className="text-[10px] font-semibold text-[#9E7400] mt-0.5 truncate">
                  {stringResource('att_status_late')}
                </div>
              </div>
            </div>
          </SchoolCard>
        </div>
      )}

      {/* ==================== 2. MONTHLY VIEW ==================== */}
      {mode === 'monthly' && (
        <div className="space-y-3.5">
          {/* Bar Chart (recharts) of Attendance Percentage per Month */}
          <SchoolCard className="space-y-3">
            <div className="font-heading text-xs font-bold text-[#14284B]">
              {stringResource('att_chart_title')}
            </div>

            {chartData.length === 0 ? (
              <EmptyState
                title={stringResource('att_empty_month_title')}
                subtitle={stringResource('att_empty_month_subtitle')}
              />
            ) : (
              <div dir="ltr" className="w-full h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 24, right: 16, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E4E8F0"
                    />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fill: '#1B2233', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#E4E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: '#6B7385', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [
                        formatPercentValue(Number(val)),
                        stringResource('att_month_percentage_label'),
                      ]}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E4E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="percentage"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={54}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell
                          key={`cell_${entry.monthCode}`}
                          fill={idx % 2 === 0 ? '#14284B' : '#F28C28'}
                        />
                      ))}
                      <LabelList
                        dataKey="percentageLabel"
                        position="top"
                        fill="#14284B"
                        fontSize={11}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SchoolCard>

          {/* Monthly List Below with Month Name, Percentage & Counts */}
          <div className="space-y-2.5">
            <div className="font-heading text-xs font-bold text-[#14284B] px-1">
              {stringResource('att_monthly_list_title')}
            </div>

            {summary.monthlyPercentages
              .slice()
              .reverse()
              .map((m) => (
                <SchoolCard key={m.month} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-heading text-sm font-bold text-[#14284B]">
                        {formatYearMonthLabel(m.month, stringResource)}
                      </div>
                      <div className="text-[11px] text-[#6B7385]">
                        {stringResource('att_marked_days_label')}:{' '}
                        <span dir="ltr" className="font-mono font-semibold">
                          {m.totalDays}
                        </span>
                      </div>
                    </div>

                    <span
                      dir="ltr"
                      className="px-3 py-1 rounded-xl bg-[#2E9E5B]/12 text-[#2E9E5B] font-heading text-sm font-bold tabular-nums"
                    >
                      {formatPercentValue(m.percentage)}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-[#E4E8F0]">
                    <div className="rounded-xl bg-[#F6F8FC] p-2">
                      <div
                        dir="ltr"
                        className="font-mono text-xs font-bold text-[#2E9E5B]"
                      >
                        {m.presentDays}
                      </div>
                      <div className="text-[10px] text-[#6B7385] truncate">
                        {stringResource('att_status_present')}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#F6F8FC] p-2">
                      <div
                        dir="ltr"
                        className="font-mono text-xs font-bold text-[#D64545]"
                      >
                        {m.absentDays}
                      </div>
                      <div className="text-[10px] text-[#6B7385] truncate">
                        {stringResource('att_status_absent')}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#F6F8FC] p-2">
                      <div
                        dir="ltr"
                        className="font-mono text-xs font-bold text-[#2F80ED]"
                      >
                        {m.leaveDays}
                      </div>
                      <div className="text-[10px] text-[#6B7385] truncate">
                        {stringResource('att_status_leave')}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#F6F8FC] p-2">
                      <div
                        dir="ltr"
                        className="font-mono text-xs font-bold text-[#9E7400]"
                      >
                        {m.lateDays}
                      </div>
                      <div className="text-[10px] text-[#6B7385] truncate">
                        {stringResource('att_status_late')}
                      </div>
                    </div>
                  </div>
                </SchoolCard>
              ))}
          </div>
        </div>
      )}

      {/* ==================== 3. ALL TIME VIEW ==================== */}
      {mode === 'all_time' && (
        <div className="space-y-3.5">
          {/* Overall Percentage Ring Card */}
          <SchoolCard className="flex flex-col items-center text-center py-6 space-y-3">
            <div className="font-heading text-xs font-bold text-[#14284B]">
              {stringResource('att_all_time_ring_title')}
            </div>

            <AttendanceProgressRing
              percentage={summary.allTimePercentage}
              size={132}
              strokeWidth={11}
              subtitle={`${summary.allTimeTotalDays} ${stringResource(
                'att_marked_days_label'
              )}`}
            />
          </SchoolCard>

          {/* Four Stat Cards: Present, Absent, Leave, Late */}
          <div className="grid grid-cols-2 gap-3">
            <SchoolCard className="space-y-1 border-s-4 border-s-[#2E9E5B]">
              <div className="text-xs font-medium text-[#6B7385]">
                {stringResource('att_status_present')}
              </div>
              <div
                dir="ltr"
                className="font-heading text-2xl font-bold text-[#2E9E5B] tabular-nums text-start"
              >
                {summary.allTimePresentDays}
              </div>
            </SchoolCard>

            <SchoolCard className="space-y-1 border-s-4 border-s-[#D64545]">
              <div className="text-xs font-medium text-[#6B7385]">
                {stringResource('att_status_absent')}
              </div>
              <div
                dir="ltr"
                className="font-heading text-2xl font-bold text-[#D64545] tabular-nums text-start"
              >
                {summary.allTimeAbsentDays}
              </div>
            </SchoolCard>

            <SchoolCard className="space-y-1 border-s-4 border-s-[#2F80ED]">
              <div className="text-xs font-medium text-[#6B7385]">
                {stringResource('att_status_leave')}
              </div>
              <div
                dir="ltr"
                className="font-heading text-2xl font-bold text-[#2F80ED] tabular-nums text-start"
              >
                {summary.allTimeLeaveDays}
              </div>
            </SchoolCard>

            <SchoolCard className="space-y-1 border-s-4 border-s-[#F2B705]">
              <div className="text-xs font-medium text-[#6B7385]">
                {stringResource('att_status_late')}
              </div>
              <div
                dir="ltr"
                className="font-heading text-2xl font-bold text-[#9E7400] tabular-nums text-start"
              >
                {summary.allTimeLateDays}
              </div>
            </SchoolCard>
          </div>

          {/* Short Calculation Note in Both Languages */}
          <SchoolCard className="flex items-start gap-2.5 bg-white">
            <Info className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6B7385] leading-relaxed">
              {stringResource('att_calculation_note')}
            </p>
          </SchoolCard>
        </div>
      )}

      {/* Day Detail Bottom Sheet (when tapping a day on the Daily calendar) */}
      {selectedDayCell && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#14284B]/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedDayCell(null)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[28px] border-t border-[#E4E8F0] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-[#E4E8F0] mx-auto" />

            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-base font-bold text-[#14284B]">
                  {stringResource('att_day_detail_title')}
                </h3>
                <p
                  dir="ltr"
                  className="text-xs font-mono text-[#6B7385] text-start"
                >
                  {formatSchoolDate(selectedDayCell.dateStr)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayCell(null)}
                className="w-8 h-8 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#6B7385] hover:text-[#14284B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0]">
                <span className="text-xs font-semibold text-[#6B7385]">
                  {stringResource('att_day_status_label')}
                </span>
                {selectedDayCell.record ? (
                  <AttendanceStatusBadge
                    status={selectedDayCell.record.status}
                  />
                ) : selectedDayCell.holiday || selectedDayCell.isSunday ? (
                  <AttendanceStatusBadge
                    status={null}
                    customLabel={
                      selectedDayCell.holiday
                        ? language === 'ur'
                          ? selectedDayCell.holiday.titleUr
                          : selectedDayCell.holiday.titleEn
                        : stringResource('att_status_sunday_holiday')
                    }
                  />
                ) : (
                  <AttendanceStatusBadge
                    status={null}
                    customLabel={stringResource('att_status_unmarked_day')}
                  />
                )}
              </div>

              <div className="p-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] space-y-1">
                <div className="text-xs font-semibold text-[#6B7385]">
                  {stringResource('att_day_remark_label')}
                </div>
                <div className="text-sm font-medium text-[#1B2233]">
                  {selectedDayCell.record?.remarks ||
                    (selectedDayCell.holiday
                      ? language === 'ur'
                        ? selectedDayCell.holiday.titleUr
                        : selectedDayCell.holiday.titleEn
                      : stringResource('att_day_no_remark'))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PullToRefreshContainer>
  );
};
