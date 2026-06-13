import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogAuthorMeta from "@/components/blog/BlogAuthorMeta";
import BlogPostBody from "@/components/blog/BlogPostBody";
import HeroBanner from "@/components/HeroBanner";
import ContentSection from "@/components/layout/ContentSection";
import { getSiteConfig } from "@/lib/content";
import { listBlogPostSlugs, loadBlogPost } from "@/lib/content/load-blog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listBlogPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = loadBlogPost(slug);
  if (!post) {
    return {};
  }

  const site = getSiteConfig();

  return {
    title: `${post.title} | ${site.name}`,
    description: post.desc,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = loadBlogPost(slug);
  if (!post) {
    notFound();
  }

  const site = getSiteConfig();
  const heroKicker = post.author || post.authors.length > 0 ? (
    <span className="blog-post-hero__kicker">
      <span>{post.date}</span>
      <span aria-hidden> · </span>
      <BlogAuthorMeta
        authors={post.authors}
        authorLabel={post.author}
        linkAuthors
      />
    </span>
  ) : (
    post.date
  );

  return (
    <main>
      <HeroBanner
        title={post.title}
        kicker={heroKicker || site.name}
        tags={post.tags}
        compact
      />

      <ContentSection className="section-page-body section-page-body--blog">
        <article className="blog-post-page">
          <BlogPostBody content={post.body} />

          <footer className="blog-post-page__footer">
            <Link href="/blog" className="site-link site-link--back">
              ← Back to blog
            </Link>
          </footer>
        </article>
      </ContentSection>
    </main>
  );
}
