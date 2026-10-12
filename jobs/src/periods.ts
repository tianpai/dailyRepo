export function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function parseDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    utcToday(date) !== value
  ) {
    throw new JobInputError(`Invalid UTC date: ${value}. Use YYYY-MM-DD.`);
  }
  return date;
}

export function shiftDate(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return utcToday(date);
}

export function datesBetween(start: string, end: string): string[] {
  parseDate(start);
  parseDate(end);
  const dates: string[] = [];
  for (let date = start; date <= end; date = shiftDate(date, 1))
    dates.push(date);
  return dates;
}

export function weeklyPeriod(weekOf?: string, now = new Date()) {
  const reference = weekOf ?? shiftDate(utcToday(now), -7);
  const day = parseDate(reference).getUTCDay();
  const start = shiftDate(reference, -((day + 6) % 7));
  const end = shiftDate(start, 6);
  if (end >= utcToday(now)) {
    throw new JobInputError(
      'Weekly analysis requires a completed Monday–Sunday UTC week',
    );
  }

  // Retain the existing collection's year/week convention, using Monday in
  // UTC consistently. periodStart/periodEnd identify the actual input window.
  const monday = parseDate(start);
  const year = monday.getUTCFullYear();
  const startOfYear = parseDate(`${year}-01-01`);
  const days = Math.floor(
    (monday.getTime() - startOfYear.getTime()) / 86400000,
  );
  const week = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
  return { start, end, year, week };
}
import { JobInputError } from './errors';
