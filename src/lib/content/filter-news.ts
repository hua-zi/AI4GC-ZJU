import type { NewsItem } from "@/types/lab";

export function filterNews(
  items: NewsItem[],
  options: {
    filter?: "featured" | "all";
    limit?: number;
  },
): NewsItem[] {
  let filtered = items;

  if (options.filter === "featured") {
    const featured = filtered.filter((item) => item.featured);
    filtered = featured.length > 0 ? featured : filtered;
  }

  if (options.limit !== undefined) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}
