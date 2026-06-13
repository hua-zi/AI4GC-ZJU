import LinkChip from "@/components/site/LinkChip";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { MemberLink } from "@/types/lab";

type MemberLinksProps = {
  links: MemberLink[];
  className?: string;
  githubStars?: GitHubStarsMap;
};

export default function MemberLinks({ links, className, githubStars }: MemberLinksProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "member-card__links site-link-chip-list"}>
      {links.map((link) => (
        <LinkChip key={`${link.label}-${link.href}`} link={link} githubStars={githubStars} />
      ))}
    </div>
  );
}
