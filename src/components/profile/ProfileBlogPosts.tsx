import Link from "next/link";
import Tag from "@/components/site/Tag";
import { newsDateTimeAttr } from "@/lib/content/date";
import type { BlogChannel, BlogPost } from "@/types/lab";

type ProfileBlogPostsProps = {
  title: string;
  channels: BlogChannel[];
  posts: BlogPost[];
};

export default function ProfileBlogPosts({ title, channels, posts }: ProfileBlogPostsProps) {
  if (channels.length === 0 && posts.length === 0) {
    return null;
  }

  const showLabNotesHeading = channels.length > 0 && posts.length > 0;

  return (
    <section className="profile-markdown-blog">
      <h2 className="profile-markdown-body__h2">{title}</h2>

      {channels.length > 0 ? (
        <div className="profile-blog-channels">
          {channels.map((channel) => (
            <a
              key={`${channel.platform}-${channel.href}`}
              href={channel.href}
              className={`profile-blog-channel profile-blog-channel--${channel.platform}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="profile-blog-channel__platform">{channel.platformLabel}</span>
              <span className="profile-blog-channel__label">{channel.label}</span>
              {channel.desc ? (
                <p className="profile-blog-channel__desc">{channel.desc}</p>
              ) : null}
              <span className="profile-blog-channel__cta" aria-hidden>
                Visit →
              </span>
            </a>
          ))}
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="profile-markdown-blog__list">
          {showLabNotesHeading ? (
            <h3 className="profile-blog-posts__heading">Lab notes</h3>
          ) : null}
          {posts.map((post) => (
            <article key={post.id} className="profile-blog-entry">
              <time
                className="profile-blog-entry__date"
                dateTime={newsDateTimeAttr(post.date)}
              >
                {post.date}
              </time>
              <div className="profile-blog-entry__content">
                <h3 className="profile-blog-entry__title">
                  <Link href={`/blog/${post.id}`} className="site-link site-link--title">
                    {post.title}
                  </Link>
                </h3>
                {post.desc ? <p className="profile-blog-entry__desc">{post.desc}</p> : null}
                {post.tags.length > 0 ? (
                  <div className="site-tag-list profile-blog-entry__tags">
                    {post.tags.map((tag) => (
                      <Tag key={tag} label={tag} />
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
