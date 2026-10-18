/**
 * Al Furqan School Okara - Regional Formatters
 * - Money: whole rupees shown as "Rs 2,500"
 * - Dates: "17 Oct 2026"
 * - Timezone: Asia/Karachi
 * - Numerals: Western digits (0-9) in both English and Urdu
 */

export function formatRupees(amountWholeRupees: number): string {
  const rounded = Math.round(amountWholeRupees);
  const formattedDigits = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    useGrouping: true,
  }).format(Math.abs(rounded));

  return rounded < 0 ? `-Rs ${formattedDigits}` : `Rs ${formattedDigits}`;
}

export function formatSchoolDate(dateInput: Date | string | number): string {
  const date =
    typeof dateInput === 'object'
      ? dateInput
      : typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
      ? new Date(`${dateInput}T12:00:00+05:00`)
      : new Date(dateInput);
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Karachi',
    numberingSystem: 'latn',
  }).formatToParts(date);

  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const month = parts.find((p) => p.type === 'month')?.value ?? 'Jan';
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';

  return `${day} ${month} ${year}`;
}

export function formatSchoolTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '08:35';
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Karachi',
    numberingSystem: 'latn',
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === 'hour')?.value ?? '08';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '35';

  return `${hour}:${minute}`;
}
