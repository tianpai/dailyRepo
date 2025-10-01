export function getTodayUTC() {
  return new Date().toISOString().split('T')[0];
}

export const getYesterdayUTC = () =>
  new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const getUTCDate = (dateStr: string) =>
  new Date(dateStr).toISOString().split('T')[0];

export function calculateAgeInDays(createdDate: string, updatedDate: string) {
  const created = new Date(createdDate);
  const updated = new Date(updatedDate);

  const differenceInMilliseconds = updated.getTime() - created.getTime();
  const ageInDays = differenceInMilliseconds / (24 * 60 * 60 * 1000);

  return Math.floor(ageInDays);
}

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
