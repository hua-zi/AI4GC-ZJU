import { formatStarCount, getGitHubStars, parseGitHubRepo } from "@/lib/github-stars";
import { isMailtoLink } from "@/lib/content/member-email";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { LinkItem } from "@/types/lab";

type LinkChipProps = {
  link: LinkItem;
  githubStars?: GitHubStarsMap;
};

function isExternalLink(href: string, external?: boolean): boolean {
  if (external != null) return external;
  if (isMailtoLink(href)) return false;
  return /^https?:\/\//.test(href);
}

export default function LinkChip({ link, githubStars = {} }: LinkChipProps) {
  const external = isExternalLink(link.href, link.external);
  const stars = parseGitHubRepo(link.href) ? getGitHubStars(link.href, githubStars) : undefined;

  return (
    <a
      href={link.href}
      className="site-link-chip"
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      <span className="site-link-chip__label">{link.label}</span>
      {stars != null ? (
        <span className="site-link-chip__stars" aria-label={`${stars} project stars`}>
          <span className="site-link-chip__star-icon" aria-hidden="true">
            ★
          </span>
          {formatStarCount(stars)}
        </span>
      ) : null}
    </a>
  );
}
