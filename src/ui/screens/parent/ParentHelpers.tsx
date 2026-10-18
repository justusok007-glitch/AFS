import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Plane,
  RefreshCw,
} from 'lucide-react';
import {
  AttendanceStatus,
  PaymentMethod,
  VoucherStatus,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import { useStringResource } from '../../theme/LocaleContext';

/**
 * Formats a percentage cleanly with Western digits (e.g. 100 -> "100%", 93.3 -> "93.3%").
 */
export function formatPercentValue(value: number): string {
  const rounded = Number(value.toFixed(1));
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

/**
 * Formats a "YYYY-MM" billing/attendance month using localized month names and Western digits.
 */
export function formatYearMonthLabel(
  yearMonth: string,
  stringResource: (key: StringKey) => string,
  short = false
): string {
  const [year, monthPart] = yearMonth.split('-');
  const monthCode = (monthPart || '10').padStart(2, '0');
  const key = (
    short ? `month_short_${monthCode}` : `month_${monthCode}`
  ) as StringKey;
  return `${stringResource(key)} ${year}`;
}

/**
 * Formats a PaymentMethod enum value using translation strings.
 */
export function formatPaymentMethodLabel(
  method: PaymentMethod,
  stringResource: (key: StringKey) => string
): string {
  return stringResource(`method_${method}` as StringKey);
}

/**
 * Colored chip for AttendanceStatus:
 * Present = green (#2E9E5B), Absent = red (#D64545), Leave = blue (#2F80ED),
 * Late = amber (#F2B705), Not marked yet = grey (#6B7385).
 */
export const AttendanceStatusBadge: React.FC<{
  status: AttendanceStatus | null;
  customLabel?: string;
}> = ({ status, customLabel }) => {
  const { stringResource } = useStringResource();

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#E4E8F0]/70 text-[#6B7385] text-xs font-semibold whitespace-nowrap shrink-0">
        <HelpCircle className="w-3.5 h-3.5 shrink-0 text-[#6B7385]" />
        <span>{customLabel ?? stringResource('att_status_not_marked')}</span>
      </span>
    );
  }

  switch (status) {
    case AttendanceStatus.PRESENT:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2E9E5B]/12 text-[#2E9E5B] text-xs font-semibold whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#2E9E5B]" />
          <span>{customLabel ?? stringResource('att_status_present')}</span>
        </span>
      );
    case AttendanceStatus.ABSENT:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#D64545]/12 text-[#D64545] text-xs font-semibold whitespace-nowrap shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#D64545]" />
          <span>{customLabel ?? stringResource('att_status_absent')}</span>
        </span>
      );
    case AttendanceStatus.LEAVE:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2F80ED]/12 text-[#2F80ED] text-xs font-semibold whitespace-nowrap shrink-0">
          <Plane className="w-3.5 h-3.5 shrink-0 text-[#2F80ED]" />
          <span>{customLabel ?? stringResource('att_status_leave')}</span>
        </span>
      );
    case AttendanceStatus.LATE:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F2B705]/18 text-[#9E7400] text-xs font-semibold whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 shrink-0 text-[#F2B705]" />
          <span>{customLabel ?? stringResource('att_status_late')}</span>
        </span>
      );
  }
};

/**
 * Colored chip for VoucherStatus:
 * Paid = green (#2E9E5B), Partial = amber (#F2B705), Unpaid = red (#D64545).
 */
export const VoucherStatusBadge: React.FC<{
  status: VoucherStatus;
}> = ({ status }) => {
  const { stringResource } = useStringResource();

  switch (status) {
    case VoucherStatus.PAID:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#2E9E5B]/12 text-[#2E9E5B] text-[11px] font-bold whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>{stringResource('voucher_status_paid')}</span>
        </span>
      );
    case VoucherStatus.PARTIAL:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F2B705]/18 text-[#9E7400] text-[11px] font-bold whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3 shrink-0 text-[#F2B705]" />
          <span>{stringResource('voucher_status_partial')}</span>
        </span>
      );
    case VoucherStatus.UNPAID:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#D64545]/12 text-[#D64545] text-[11px] font-bold whitespace-nowrap shrink-0">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{stringResource('voucher_status_unpaid')}</span>
        </span>
      );
  }
};

/**
 * Circular Progress Ring for Attendance Percentage
 */
export const AttendanceProgressRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  subtitle?: string;
}> = ({ percentage, size = 108, strokeWidth = 10, subtitle }) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const ringColor =
    clamped >= 90 ? '#2E9E5B' : clamped >= 75 ? '#F28C28' : '#D64545';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E4E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      <div
        dir="ltr"
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-1"
      >
        <span className="font-heading text-base font-bold text-[#14284B] tabular-nums leading-none">
          {formatPercentValue(clamped)}
        </span>
        {subtitle && (
          <span className="text-[10px] font-medium text-[#6B7385] mt-1 leading-tight">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Pull-down refresh wrapper & interactive refresh bar
 */
export const PullToRefreshContainer: React.FC<{
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}> = ({ refreshing, onRefresh, children }) => {
  const { stringResource } = useStringResource();
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      setPullDistance(Math.min(72, delta * 0.45));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= 48 && !refreshing) {
      onRefresh();
    }
    setPullDistance(0);
    startYRef.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="space-y-3"
    >
      {/* Pull-down indicator or compact refresh header */}
      <div
        className="flex items-center justify-end transition-all"
        style={{
          paddingTop: pullDistance > 8 ? `${Math.round(pullDistance / 2)}px` : 0,
        }}
      >
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="min-h-[32px] px-3 py-1 rounded-xl bg-white border border-[#E4E8F0] text-[#14284B] text-[11px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F6F8FC] active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#F28C28] ${
              refreshing ? 'animate-spin' : ''
            }`}
          />
          <span>
            {refreshing
              ? stringResource('refreshing_label')
              : stringResource('pull_to_refresh')}
          </span>
        </button>
      </div>
      {children}
    </div>
  );
};
