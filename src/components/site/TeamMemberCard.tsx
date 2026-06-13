import Link from "next/link";
import MemberAvatar from "@/components/site/MemberAvatar";
import MemberEmail from "@/components/site/MemberEmail";
import MemberLinks from "@/components/site/MemberLinks";
import Tag from "@/components/site/Tag";
import { filterTeamCardMemberLinks } from "@/lib/content/member-blog-channels";
import { formatMemberStartMeta } from "@/lib/content/slug";
import type { TeamMember } from "@/types/lab";

type TeamMemberCardProps = {
  member: TeamMember;
  startDateLabel?: string;
  featured?: boolean;
  compact?: boolean;
};

function memberMetaLine(member: TeamMember, startDateLabel?: string): string | null {
  const parts: string[] = [];

  if (member.degree) {
    parts.push(member.degree);
  }

  if (member.startDate) {
    parts.push(formatMemberStartMeta(member.startDate, startDateLabel));
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function MemberTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="site-tag-list member-card__tags">
      {tags.map((tag) => (
        <Tag key={tag} label={tag} className="site-tag--brand" />
      ))}
    </div>
  );
}

function MemberCardHeader({
  member,
  metaLine,
  profileHref,
}: {
  member: TeamMember;
  metaLine: string | null;
  profileHref: string | null;
}) {
  const titleBlock = (
    <>
      <h3 className="member-card__name">{member.name}</h3>
      {metaLine ? <p className="member-card__meta">{metaLine}</p> : null}
    </>
  );

  return (
    <header className="member-card__header">
      {profileHref ? (
        <Link href={profileHref} className="member-card__profile-link member-card__profile-link--header">
          {titleBlock}
        </Link>
      ) : (
        titleBlock
      )}
      {member.email ? (
        <MemberEmail email={member.email} className="member-card__header-email" />
      ) : null}
    </header>
  );
}

export default function TeamMemberCard({
  member,
  startDateLabel,
  featured = false,
  compact = false,
}: TeamMemberCardProps) {
  const avatarSize = featured ? "lg" : compact ? "sm" : "md";
  const metaLine = memberMetaLine(member, startDateLabel);
  const profileHref = member.profile ? `/${member.profile}` : null;
  const cardLinks = filterTeamCardMemberLinks(member.links);
  const classNames = [
    "member-card",
    featured ? "member-card--featured" : "",
    compact ? "member-card--compact" : "",
    profileHref ? "member-card--has-profile" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const avatar = (
    <MemberAvatar src={member.photo} name={member.name} size={avatarSize} />
  );

  const detailsBlock = (
    <>
      <p className="member-card__bio">{member.bio}</p>
      {member.tags && member.tags.length > 0 ? <MemberTags tags={member.tags} /> : null}
    </>
  );

  return (
    <article className={classNames}>
      <div className="member-card__media">
        {profileHref ? (
          <Link
            href={profileHref}
            className="member-card__avatar-link"
            aria-label={`View ${member.name} profile`}
          >
            {avatar}
          </Link>
        ) : (
          avatar
        )}
      </div>
      <div className="member-card__body">
        <MemberCardHeader member={member} metaLine={metaLine} profileHref={profileHref} />
        {profileHref ? (
          <Link href={profileHref} className="member-card__profile-link member-card__profile-link--details">
            {detailsBlock}
          </Link>
        ) : (
          <div className="member-card__details">{detailsBlock}</div>
        )}
        {cardLinks.length > 0 ? (
          <div className="member-card__actions">
            <MemberLinks links={cardLinks} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
