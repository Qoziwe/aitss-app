const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const WEEK_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (n: number) => String(n).padStart(2, '0');

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(d: Date): string {
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Weeks of a month, Monday first. Days outside the month are null. */
export function monthMatrix(d: Date): (Date | null)[][] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let day = 1; day <= days; day += 1) cells.push(new Date(d.getFullYear(), d.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "14:30" */
export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "14:30–15:00" */
export function timeRange(iso: string, minutes: number): string {
  const end = new Date(new Date(iso).getTime() + minutes * 60000);
  return `${timeLabel(iso)}–${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

/** "Tue, 25 Nov" */
export function dayLabel(d: Date): string {
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "Tue, 25 Nov · 14:30–15:00" */
export function whenLabel(iso: string, minutes: number): string {
  return `${dayLabel(new Date(iso))} · ${timeRange(iso, minutes)}`;
}

export function weekdayShort(d: Date): string {
  return WEEKDAYS_SHORT[d.getDay()]!;
}

/** Half-hour slots from 09:00 to 17:30 as [hour, minute]. */
export const TIME_SLOTS: [number, number][] = Array.from({ length: 18 }, (_, i) => [9 + Math.floor(i / 2), (i % 2) * 30]);

export function slotLabel([h, m]: [number, number]): string {
  return `${pad(h)}:${pad(m)}`;
}
