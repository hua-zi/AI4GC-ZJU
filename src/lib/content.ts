import { filterNews } from "@/lib/content/filter-news";
import { loadBlogPosts } from "@/lib/content/load-blog";
import { loadHomeContent } from "@/lib/content/load-home";
import { loadNewsItems } from "@/lib/content/load-news";
import { loadPublications } from "@/lib/content/load-publications";
import { loadSiteConfig } from "@/lib/content/load-site";
import { loadTeamContent } from "@/lib/content/load-team";
import type { BlogPost, HomeContent, NewsItem, PublicationItem, SiteConfig, TeamContent } from "@/types/lab";

export function getBlogPosts(): BlogPost[] {
  return loadBlogPosts();
}

export function getNewsItems(): NewsItem[] {
  return loadNewsItems();
}

export function getPublications(): PublicationItem[] {
  return loadPublications();
}

export function getTeamContent(): TeamContent {
  return loadTeamContent();
}

export function getHomeContent(): HomeContent {
  return loadHomeContent();
}

export function getSiteConfig(): SiteConfig {
  return loadSiteConfig();
}

export function getFeaturedNews(count?: number): NewsItem[] {
  const site = getSiteConfig();
  return filterNews(getNewsItems(), {
    filter: "featured",
    limit: count ?? site.featuredNewsCount,
  });
}

export function getFilteredNews(options: {
  filter?: "featured" | "all";
  limit?: number;
}): NewsItem[] {
  return filterNews(getNewsItems(), options);
}
