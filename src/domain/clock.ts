import { DayOfWeek, SchoolHoliday } from './models/models';

const DEMO_DATE_STORAGE_KEY = 'afs_okara_demo_date_override_v1';

type ClockListener = () => void;
const listeners = new Set<ClockListener>();

function notifyClockListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  });
}

/**
 * Subscribe to demo date override changes so UI components (like the top orange strip)
 * update immediately when the developer sets or clears a demo date.
 */
export function subscribeToClock(listener: ClockListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns the real current calendar date ("YYYY-MM-DD") in Asia/Karachi timezone.
 */
export function realTodayKarachi(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    numberingSystem: 'latn',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const m = parts.find((p) => p.type === 'month')?.value ?? '10';
  const d = parts.find((p) => p.type === 'day')?.value ?? '18';
  return `${y}-${m}-${d}`;
}

/**
 * Returns the active Demo Date override ("YYYY-MM-DD") if set, or null when using real date.
 */
export function getDemoDateOverride(): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(DEMO_DATE_STORAGE_KEY);
    if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
      return raw.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sets or clears the Demo Date override ("YYYY-MM-DD" or null).
 * If dateStr equals the real Karachi date or is empty/null, the override is cleared.
 */
export function setDemoDateOverride(dateStr: string | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const trimmed = dateStr?.trim() ?? '';
    if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      window.localStorage.removeItem(DEMO_DATE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(DEMO_DATE_STORAGE_KEY, trimmed);
    }
  } catch {
    // Ignore storage errors
  }
  notifyClockListeners();
}

/**
 * Returns "today" ("YYYY-MM-DD") in Asia/Karachi:
 * uses the Demo Date override if active, otherwise the real Asia/Karachi date.
 */
export function today(): string {
  return getDemoDateOverride() ?? realTodayKarachi();
}

export const realToday = realTodayKarachi;

/**
 * Returns the current YearMonth ("YYYY-MM") in Asia/Karachi based on today().
 */
export function currentMonth(): string {
  return today().slice(0, 7);
}

/**
 * Returns the real current time of day ("HH:mm", 24-hour) in Asia/Karachi timezone.
 */
export function currentTimeHHMM(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  }).formatToParts(new Date());
  const hh = parts.find((p) => p.type === 'hour')?.value ?? '08';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '30';
  return `${hh}:${mm}`;
}

/**
 * Returns the real current time of day ("HH:mm:ss", 24-hour) in Asia/Karachi timezone.
 */
export function currentTimeHHMMSS(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  }).formatToParts(new Date());
  const hh = parts.find((p) => p.type === 'hour')?.value ?? '08';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '30';
  const ss = parts.find((p) => p.type === 'second')?.value ?? '00';
  return `${hh}:${mm}:${ss}`;
}

/**
 * Returns a Date object combining today() (demo or real date) with the real time of day in Asia/Karachi (+05:00).
 */
export function now(): Date {
  return new Date(`${today()}T${currentTimeHHMMSS()}+05:00`);
}

/**
 * Returns an ISO timestamp string combining today() with the real time of day in Asia/Karachi (+05:00).
 */
export function nowIso(): string {
  return `${today()}T${currentTimeHHMMSS()}+05:00`;
}

/**
 * Shifts an ISO date ("YYYY-MM-DD") by deltaDays.
 */
export function addDaysIso(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Shifts a YearMonth ("YYYY-MM") by deltaMonths.
 */
export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const [yStr, mStr] = yearMonth.split('-');
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1;
  const d = new Date(Date.UTC(year, monthIndex + deltaMonths, 1));
  const nextYear = d.getUTCFullYear();
  const nextMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

const UTC_DAY_TO_ENUM: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

/**
 * Checks whether a given ISO date ("YYYY-MM-DD") is a weekly off day (e.g. Sunday)
 * or a holiday in the provided holidays list.
 */
export function checkWeeklyOffOrHoliday(
  isoDate: string,
  holidays: SchoolHoliday[],
  weeklyOffDays: DayOfWeek[] = [DayOfWeek.SUNDAY],
  campusId: string | null = null
): {
  isOff: boolean;
  isWeeklyOff: boolean;
  holiday: SchoolHoliday | null;
} {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dowEnum = UTC_DAY_TO_ENUM[dt.getUTCDay()] ?? DayOfWeek.SUNDAY;
  const isWeeklyOff =
    dt.getUTCDay() === 0 || weeklyOffDays.includes(dowEnum);

  const matchedHoliday =
    holidays.find(
      (h) =>
        h.date === isoDate &&
        (!campusId || h.campusId === null || h.campusId === campusId)
    ) ?? null;

  return {
    isOff: isWeeklyOff || matchedHoliday !== null,
    isWeeklyOff,
    holiday: matchedHoliday,
  };
}

export const SchoolClock = {
  now,
  nowIso,
  today,
  realTodayKarachi,
  currentMonth,
  currentTimeHHMM,
  currentTimeHHMMSS,
  getDemoDateOverride,
  setDemoDateOverride,
  subscribeToClock,
  addDaysIso,
  shiftYearMonth,
  checkWeeklyOffOrHoliday,
};
