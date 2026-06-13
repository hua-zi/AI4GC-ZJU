import type { NewsItem } from "@/types/lab";

export type NewsDateGroup = {
  date: string;
  items: NewsItem[];
};

/** Merge consecutive items that share the same display date (e.g. two entries in Apr 2026). */
export function groupNewsByDate(items: NewsItem[]): NewsDateGroup[] {
  const groups: NewsDateGroup[] = [];

  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.date === item.date) {
      last.items.push(item);
      continue;
    }
    groups.push({ date: item.date, items: [item] });
  }

  return groups;
}
