import { UTC_OFFSET } from "@/lib/constants";

// All appointment/scheduling logic must go through this module instead of
// calling Date#getDay()/getHours()/etc directly, which read the *server's*
// local clock/timezone (unpredictable across dev machines / Vercel regions).
// Buenos Aires is a fixed UTC-3 offset with no DST, so plain arithmetic against
// that fixed offset is correct and doesn't need a timezone database.

export const DAY_OF_WEEK_BY_INDEX = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export type DayOfWeekName = (typeof DAY_OF_WEEK_BY_INDEX)[number];

/** Current instant, as a UTC Date. Single source of truth for "now" server-side. */
export function nowUtc(): Date {
  return new Date();
}

/** "YYYY-MM-DD" + "HH:mm" wall-clock time in Buenos Aires -> absolute UTC Date. */
export function baToUtc(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000${UTC_OFFSET}`);
}

/** Absolute UTC Date -> "YYYY-MM-DD" calendar date as seen in Buenos Aires. */
export function dateStrInBA(d: Date): string {
  // Shift by the fixed offset, then read UTC fields, so this is correct
  // regardless of the host machine's own local timezone.
  const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Absolute UTC Date -> "HH:mm" wall-clock time as seen in Buenos Aires. */
export function timeStrInBA(d: Date): string {
  const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const h = String(shifted.getUTCHours()).padStart(2, "0");
  const min = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

/** Day of week (Prisma DayOfWeek enum name) for a "YYYY-MM-DD" BA calendar date. */
export function dayOfWeekForDateStr(dateStr: string): DayOfWeekName {
  // Anchor at local noon so the UTC weekday read-back can never roll over to
  // the adjacent day because of the -03:00 shift.
  const anchor = baToUtc(dateStr, "12:00");
  return DAY_OF_WEEK_BY_INDEX[anchor.getUTCDay()];
}

/** "YYYY-MM-DD" for "today" in Buenos Aires, computed from the real current instant. */
export function todayBA(): string {
  return dateStrInBA(nowUtc());
}

export function startOfDayUtc(dateStr: string): Date {
  return baToUtc(dateStr, "00:00");
}

export function endOfDayUtc(dateStr: string): Date {
  return baToUtc(addDaysToDateStr(dateStr, 1), "00:00");
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const shifted = new Date(base + days * 24 * 60 * 60 * 1000);
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function compareDateStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** "DD/MM/YYYY" for display, from a "YYYY-MM-DD" BA date string. */
export function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/** "DD/MM/YYYY" for display, from a UTC instant (converted to BA first). */
export function formatDateTimeDisplay(d: Date): { date: string; time: string } {
  return { date: formatDateDisplay(dateStrInBA(d)), time: timeStrInBA(d) };
}

export function addMinutesToTimeStr(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function compareTimeStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
