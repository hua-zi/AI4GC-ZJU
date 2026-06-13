"use client";

import { useMemo, useState } from "react";
import ContentSection from "@/components/layout/ContentSection";
import BlogListItem from "@/components/blog/BlogListItem";
import SegmentedControl from "@/components/site/SegmentedControl";
import { parseNewsDateKey } from "@/lib/content/date";
import type { BlogPost } from "@/types/lab";

const sortOptions = [
  { value: "newest" as const, label: "Newest first" },
  { value: "oldest" as const, label: "Oldest first" },
];

type BlogPageClientProps = {
  posts: BlogPost[];
  visibleCount: number;
};

export default function BlogPageClient({ posts, visibleCount }: BlogPageClientProps) {
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      return sortOrder === "newest"
        ? parseNewsDateKey(b.date) - parseNewsDateKey(a.date)
        : parseNewsDateKey(a.date) - parseNewsDateKey(b.date);
    });
  }, [sortOrder, posts]);

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / visibleCount));
  const pageIndex = Math.min(page, totalPages - 1);

  const items = useMemo(() => {
    const start = pageIndex * visibleCount;
    return sortedPosts.slice(start, start + visibleCount);
  }, [pageIndex, sortedPosts, visibleCount]);

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
            ariaLabel="Sort blog posts by date"
          />
        </div>
        <div className="blog-feed blog-feed--cards">
          {items.map((post) => (
            <BlogListItem key={post.id} post={post} />
          ))}
        </div>
        {totalPages > 1 ? (
          <nav className="section-actions section-actions--pagination" aria-label="Blog pagination">
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
