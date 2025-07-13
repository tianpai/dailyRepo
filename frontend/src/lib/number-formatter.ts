export function formatNumber(num: number): string {
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith(".0")
      ? `${formatted.slice(0, -2)}k`
      : `${formatted}k`;
  }
  return num.toString();
}
