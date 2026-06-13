import NewsListItem from "@/components/site/NewsListItem";
import { cn } from "@/lib/utils";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { NewsItem } from "@/types/lab";

type NewsFeedProps = {
  items: NewsItem[];
  showTitleLink?: boolean;
  compact?: boolean;
  githubStars?: GitHubStarsMap;
  className?: string;
};

export default function NewsFeed({
  items,
  showTitleLink = true,
  compact = false,
  githubStars,
  className,
}: NewsFeedProps) {
  return (
    <div className={cn("news-stack", className)}>
      {items.map((item) => (
        <NewsListItem
          key={item.id}
          item={item}
          showTitleLink={showTitleLink}
          compact={compact}
          githubStars={githubStars}
        />
      ))}
    </div>
  );
}
