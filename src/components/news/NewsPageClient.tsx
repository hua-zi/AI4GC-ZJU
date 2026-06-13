"use client";

import { useMemo, useState } from "react";
import ContentSection from "@/components/layout/ContentSection";
import NewsFeed from "@/components/site/NewsFeed";
import SegmentedControl from "@/components/site/SegmentedControl";
import { parseNewsDateKey } from "@/lib/content/date";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { NewsItem } from "@/types/lab";

const sortOptions = [
  { value: "newest" as const, label: "Newest first" },
  { value: "oldest" as const, label: "Oldest first" },
];

type NewsPageClientProps = {
  newsItems: NewsItem[];
  visibleCount: number;
  githubStars: GitHubStarsMap;
};

export default function NewsPageClient({ newsItems, visibleCount, githubStars }: NewsPageClientProps) {
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const sortedItems = useMemo(() => {
    return [...newsItems].sort((a, b) => {
      return sortOrder === "newest"
        ? parseNewsDateKey(b.date) - parseNewsDateKey(a.date)
        : parseNewsDateKey(a.date) - parseNewsDateKey(b.date);
    });
  }, [sortOrder, newsItems]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / visibleCount));
  const pageIndex = Math.min(page, totalPages - 1);

  const items = useMemo(() => {
    const start = pageIndex * visibleCount;
    return sortedItems.slice(start, start + visibleCount);
  }, [pageIndex, sortedItems, visibleCount]);

  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < totalPages - 1;

  function handleSortChange(value: "newest" | "oldest") {
    setSortOrder(value);
    setPage(0);
  }

  return (
    <main>
      <ContentSection className="section-page-body">
        <div className="section-toolbar section-toolbar--controls">
          <SegmentedControl
            value={sortOrder}
            options={sortOptions}
            onChange={handleSortChange}
            ariaLabel="Sort news by date"
          />
        </div>
        <NewsFeed items={items} githubStars={githubStars} compact />
        {totalPages > 1 ? (
          <nav className="section-actions section-actions--pagination" aria-label="News pagination">
            <button
              type="button"
              className="hero-button hero-button--secondary"
              disabled={!canGoPrevious}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span className="section-actions__page">
              {pageIndex + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="hero-button hero-button--secondary"
              disabled={!canGoNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </nav>
        ) : null}
      </ContentSection>
    </main>
  );
}
