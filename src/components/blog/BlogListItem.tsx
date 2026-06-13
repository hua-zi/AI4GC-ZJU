import Link from "next/link";
import Image from "next/image";
import Tag from "@/components/site/Tag";
import { newsDateTimeAttr } from "@/lib/content/date";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types/lab";

const blogThumbSizes = "(min-width: 768px) 28rem, 100vw";

type BlogListItemProps = {
  post: BlogPost;
};

export default function BlogListItem({ post }: BlogListItemProps) {
  const metaLine = [post.date, post.author].filter(Boolean).join(" · ");
  const href = `/blog/${post.id}`;

  return (
    <article className="blog-card-article">
      <Link
        href={href}
        className={cn("blog-card", post.cover && "blog-card--with-cover")}
        aria-label={post.title}
      >
        {post.cover ? (
          <div className="blog-card__media">
            <Image
              src={post.cover}
              alt=""
              fill
              className="blog-card__cover"
              sizes={blogThumbSizes}
              aria-hidden
            />
          </div>
        ) : null}

        <div className="blog-card__body">
          {metaLine ? (
            <time className="blog-card__meta" dateTime={newsDateTimeAttr(post.date)}>
              {metaLine}
            </time>
          ) : null}

          <h3 className="blog-card__title">{post.title}</h3>

          {post.desc ? <p className="blog-card__desc">{post.desc}</p> : null}

          {post.tags.length > 0 ? (
            <div className="site-tag-list blog-card__tags">
              {post.tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
