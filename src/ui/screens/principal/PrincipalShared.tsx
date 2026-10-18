import React, { useEffect, useState } from 'react';

export const CHART = {
  navy: '#14284B',
  orange: '#F28C28',
  green: '#2E9E5B',
  blue: '#2F80ED',
  amber: '#F2B705',
  red: '#D64545',
  grey: '#6B7385',
  grid: '#E4E8F0',
};

export const CATEGORY_COLORS: Record<string, string> = {
  ARREARS: CHART.red,
  MONTHLY: CHART.navy,
  ANNUAL: CHART.orange,
  ADMISSION: CHART.blue,
  EXAM: CHART.green,
  LATE: CHART.amber,
  OTHER: CHART.grey,
};

/** Animates a number from 0 to target on mount / change. */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export const CountUp: React.FC<{
  value: number;
  format?: (n: number) => string;
}> = ({ value, format }) => {
  const v = useCountUp(value);
  return <span dir="ltr">{format ? format(v) : v.toLocaleString('en-US')}</span>;
};

export const selectCls =
  'w-full min-h-[44px] px-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] text-sm text-[#14284B]';

export function percentColor(p: number): string {
  if (p >= 90) return CHART.green;
  if (p >= 75) return CHART.amber;
  return CHART.red;
}

/** "2026-10" -> "Oct" style short labels without locale surprises. */
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function shortMonth(ym: string): string {
  const m = Number(ym.split('-')[1]);
  return MONTH_SHORT[m - 1] ?? ym;
}
