/** Sort key for news dates like "Jun 2026" — higher = more recent. */
export function parseNewsDateKey(date: string): number {
  const [monthStr, yearStr] = date.trim().split(/\s+/);
  const month = monthStr ? new Date(`${monthStr} 1, 2000`).getMonth() : 0;
  const year = Number(yearStr);
  if (Number.isNaN(year)) {
    const parsed = Date.parse(`${date} 1`);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return year * 12 + month;
}

/** ISO month string for `<time datetime>` from labels like "Jun 2026". */
export function newsDateTimeAttr(date: string): string | undefined {
  const key = parseNewsDateKey(date);
  if (key <= 0) {
    return undefined;
  }
  const year = Math.floor(key / 12);
  const month = (key % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}
