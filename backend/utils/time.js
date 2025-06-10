export function getTodayUTC() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function getYesterdayUTC() {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);

  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * given a date string in YYYY-MM-DD format in UTC timezone,
 */
export function getUTCDate(dateStr) {
  const date = new Date(dateStr);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function calculateAgeInDays(createdDate, updatedDate) {
  const created = new Date(createdDate);
  const updated = new Date(updatedDate);

  const differenceInMilliseconds = updated - created;
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
