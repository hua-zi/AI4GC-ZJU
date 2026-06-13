import Link from "next/link";
import type { BlogAuthorRef } from "@/types/lab";

type BlogAuthorMetaProps = {
  authors: BlogAuthorRef[];
  authorLabel?: string;
  linkAuthors?: boolean;
};

function AuthorName({
  author,
  linkAuthors,
}: {
  author: BlogAuthorRef;
  linkAuthors: boolean;
}) {
  if (linkAuthors && author.profileHref) {
    return (
      <Link href={author.profileHref} className="site-link site-link--inline">
        {author.name}
      </Link>
    );
  }

  return <span>{author.name}</span>;
}

export default function BlogAuthorMeta({
  authors,
  authorLabel,
  linkAuthors = false,
}: BlogAuthorMetaProps) {
  if (authors.length > 0) {
    return (
      <span className="blog-author-meta">
        {authors.map((author, index) => (
          <span key={author.id}>
            {index > 0 ? ", " : null}
            <AuthorName author={author} linkAuthors={linkAuthors} />
          </span>
        ))}
      </span>
    );
  }

  if (authorLabel?.trim()) {
    return <span className="blog-author-meta">{authorLabel}</span>;
  }

  return null;
}
