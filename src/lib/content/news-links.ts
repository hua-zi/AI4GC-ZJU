import type { LinkItem, NewsItem } from "@/types/lab";

/** Paper / Project chips — falls back to legacy `href` as Paper. */
export function getNewsLinks(item: NewsItem): LinkItem[] {
  if (item.links.length > 0) {
    return item.links;
  }
  if (item.href) {
    return [{ label: "Paper", href: item.href }];
  }
  return [];
}

export function resolveHeroFeaturedNews(
  featuredNews: { id: string } | undefined,
  items: NewsItem[],
): NewsItem | null {
  if (!featuredNews?.id) {
    return null;
  }
  return items.find((item) => item.id === featuredNews.id) ?? null;
}
