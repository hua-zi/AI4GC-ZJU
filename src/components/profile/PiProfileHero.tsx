import type { CSSProperties } from "react";
import LinkChip from "@/components/site/LinkChip";
import MemberAvatar from "@/components/site/MemberAvatar";
import MemberEmail from "@/components/site/MemberEmail";
import Tag from "@/components/site/Tag";
import { cn } from "@/lib/utils";
import type { LinkItem } from "@/types/lab";

type PiProfileHeroProps = {
  name: string;
  photo: string | null;
  degree?: string;
  backgroundImage?: string | null;
  tags?: string[];
  links?: LinkItem[];
  email?: string;
};

export default function PiProfileHero({
  name,
  photo,
  degree,
  backgroundImage,
  tags = [],
  links = [],
  email,
}: PiProfileHeroProps) {
  const hasBackground = Boolean(backgroundImage?.trim());
  const style: CSSProperties | undefined = hasBackground
    ? ({ "--pi-hero-bg-image": `url("${backgroundImage!.trim()}")` } as CSSProperties)
    : undefined;

  return (
    <section
      className={cn("pi-profile-hero", hasBackground && "pi-profile-hero--photo")}
      style={style}
      aria-label={`${name} profile`}
    >
      <div className="pi-profile-hero__inner">
        <MemberAvatar
          src={photo}
          name={name}
          size="xl"
          className="pi-profile-hero__avatar"
        />

        <h1 className="pi-profile-hero__title">{name}</h1>

        {degree ? <p className="pi-profile-hero__degree">{degree}</p> : null}

        {tags.length > 0 ? (
          <div className="site-tag-list pi-profile-hero__tags">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} className="site-tag--brand" />
            ))}
          </div>
        ) : null}

        {links.length > 0 ? (
          <div className="site-link-chip-list pi-profile-hero__links">
            {links.map((link) => (
              <LinkChip key={`${link.label}-${link.href}`} link={link} showIcon />
            ))}
          </div>
        ) : null}

        {email ? <MemberEmail email={email} className="pi-profile-hero__email" /> : null}
      </div>
    </section>
  );
}
