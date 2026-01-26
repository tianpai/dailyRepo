export function getCurrentWeekNumber(): { year: number; week: number } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
  );
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return { year: now.getFullYear(), week };
}

export function getCurrentWeekDateRangeUTC(): {
  start: string;
  end: string;
} {
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const utcDay = todayUTC.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const diffToMonday = (utcDay + 6) % 7; // Monday -> 0
  const start = new Date(todayUTC);
  start.setUTCDate(todayUTC.getUTCDate() - diffToMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
