export function getTodayUTC() {
  return new Date().toISOString().split("T")[0];
}

export const getYesterdayUTC = () =>
  new Date(Date.now() - 86400000).toISOString().split("T")[0];

/**
 * given a date string in YYYY-MM-DD format in UTC timezone,
 */
export const getUTCDate = (dateStr) =>
  new Date(dateStr).toISOString().split("T")[0];

export function calculateAgeInDays(createdDate, updatedDate) {
  const created = new Date(createdDate);
  const updated = new Date(updatedDate);

  const differenceInMilliseconds = updated.getTime() - created.getTime();
  const ageInDays = differenceInMilliseconds / (24 * 60 * 60 * 1000);

  return Math.floor(ageInDays);
}

// utils/validateDate.js
export function isValidDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) return false;

  const y = +m[1],
    mth = +m[2],
    d = +m[3];
  if (y < 2024 || mth < 1 || mth > 12) return false;
  const days = new Date(y, mth, 0).getDate();
  return d >= 1 && d <= days;
}

/**
 * matching YYYY-MM-DD format
 * also consider leap years and valid days in month
 * YYYY must be greater than 2024
 */
export function validateDate(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;

  let [_, y, M, d] = m;
  const year = +y;
  const month = +M;
  const day = +d;

  /*
   * earliest date is 2025-01-01
   */
  if (year <= 2024) return null;
  if (month < 1 || month > 12) return null;

  // days in each month
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [
    31,
    isLeap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (day < 1 || day > daysInMonth[month - 1]) return null;

  return date;
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 */
export function formatDuration(startTime: number): string {
  const endTime = performance.now();
  const duration = endTime - startTime;
  const seconds = duration / 1000;
  if (seconds > 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minute(s) ${remainingSeconds.toFixed(2)} seconds`;
  }
  return `${seconds.toFixed(2)} seconds`;
}

/**
 * Get the week number for a given date
 * Week 1 starts on January 1st, Week 2 starts on January 8th, etc.
 */
export function getWeekNumber(date: Date): { year: number; week: number } {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const daysSinceStart = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
  );
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;

  return { year, week: weekNumber };
}

/**
 * Get current week number
 */
export function getCurrentWeekNumber(): { year: number; week: number } {
  return getWeekNumber(new Date());
}
