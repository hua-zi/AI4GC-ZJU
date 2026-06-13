import BlogPageClient from "@/components/blog/BlogPageClient";
import { getBlogPosts, getSiteConfig } from "@/lib/content";

export default async function BlogPage() {
  const site = getSiteConfig();
  const posts = getBlogPosts();

  return (
    <BlogPageClient posts={posts} visibleCount={site.blogPageVisibleCount} />
  );
}
