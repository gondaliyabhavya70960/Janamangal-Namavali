import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";

/** Canonical local day key, e.g. "2026-06-25". */
export function toDayKey(input: Date | number = new Date()): string {
  const date = typeof input === "number" ? new Date(input) : input;
  return format(date, "yyyy-MM-dd");
}

export function dayKeyToDate(key: string): Date {
  return parseISO(key);
}

export function todayKey(now: number): string {
  return toDayKey(now);
}

/** Inclusive list of day keys for the last `n` days ending today. */
export function lastNDayKeys(n: number, now: number): string[] {
  const end = new Date(now);
  const start = subDays(end, n - 1);
  return eachDayOfInterval({ start, end }).map((d) => toDayKey(d));
}

export function rangeKeys(start: Date, end: Date): string[] {
  return eachDayOfInterval({ start, end }).map((d) => toDayKey(d));
}

export function weekKeys(now: number): string[] {
  const date = new Date(now);
  return rangeKeys(startOfWeek(date, { weekStartsOn: 1 }), endOfWeek(date, { weekStartsOn: 1 }));
}

export function monthKeys(now: number): string[] {
  const date = new Date(now);
  return rangeKeys(startOfMonth(date), endOfMonth(date));
}

export function yearBounds(now: number): { start: Date; end: Date } {
  const date = new Date(now);
  return { start: startOfYear(date), end: endOfYear(date) };
}

export function isWithinDayKeys(key: string, keys: Set<string>): boolean {
  return keys.has(key);
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(differenceInCalendarDays(parseISO(a), parseISO(b)));
}

export function shortDayLabel(key: string): string {
  return format(parseISO(key), "EEE");
}

export function monthDayLabel(key: string): string {
  return format(parseISO(key), "MMM d");
}

export function monthLabel(key: string): string {
  return format(parseISO(key), "MMM");
}

export function fullDateTime(ts: number): string {
  return format(new Date(ts), "PPpp");
}

export function timeLabel(ts: number): string {
  return format(new Date(ts), "p");
}

export function dateLabel(ts: number): string {
  return format(new Date(ts), "PP");
}
