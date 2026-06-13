import type { CSSProperties, ReactNode } from "react";
import HeroChannelLinks from "@/components/home/HeroChannelLinks";
import LinkChip from "@/components/site/LinkChip";
import MemberEmail from "@/components/site/MemberEmail";
import Tag from "@/components/site/Tag";
import { cn } from "@/lib/utils";
import type { HomeHeroChannel, LinkItem } from "@/types/lab";

type HeroBannerProps = {
  title: string;
  subtitle?: string;
  tags?: string[];
  links?: LinkItem[];
  email?: string;
  backgroundImage?: string;
  dark?: boolean;
  compact?: boolean;
  kicker?: ReactNode;
  stats?: Array<{ label: string; value: string }>;
  actions?: ReactNode;
  channels?: HomeHeroChannel[];
  lead?: ReactNode;
  aside?: ReactNode;
  spotlight?: ReactNode;
};

export default function HeroBanner({
  title,
  subtitle,
  tags = [],
  links = [],
  email,
  backgroundImage,
  dark = false,
  compact = false,
  kicker,
  stats = [],
  actions,
  channels = [],
  lead,
  aside,
  spotlight,
}: HeroBannerProps) {
  const hasPhoto = Boolean(backgroundImage?.trim());
  const style: CSSProperties | undefined = hasPhoto
    ? ({ "--hero-bg-image": `url("${backgroundImage!.trim()}")` } as CSSProperties)
    : undefined;
  const useDarkTheme = dark || hasPhoto;

  return (
    <section
      className={cn(
        "site-hero",
        hasPhoto && "site-hero--photo",
        useDarkTheme && "site-hero--dark",
        compact && "site-hero--compact",
      )}
      style={style}
    >
      <div
        className={cn(
          "site-hero__content",
          spotlight && "site-hero__content--with-spotlight",
        )}
      >
        <div
          className={cn(
            "site-hero__row",
            (aside || lead) && "site-hero__row--split",
            lead && "site-hero__row--profile-lead",
          )}
        >
          {lead ? <div className="site-hero__lead">{lead}</div> : null}
          <div className="site-hero__main">
            {kicker ? <p className="hero-kicker">{kicker}</p> : null}
            <h1 className="site-hero__title">{title}</h1>
            {subtitle ? <p className="site-hero__subtitle">{subtitle}</p> : null}
            {tags.length > 0 ? (
              <div className="site-tag-list site-hero__tags">
                {tags.map((tag) => (
                  <Tag key={tag} label={tag} className="site-tag--brand" />
                ))}
              </div>
            ) : null}
            {links.length > 0 ? (
              <div className="site-link-chip-list site-hero__links">
                {links.map((link) => (
                  <LinkChip key={`${link.label}-${link.href}`} link={link} />
                ))}
              </div>
            ) : null}
            {email ? <MemberEmail email={email} className="site-hero__email" /> : null}
            {stats.length ? (
              <div className="hero-stats-grid">
                {stats.map((item) => (
                  <div key={item.label} className="hero-stat">
                    <span className="hero-stat__value">{item.value}</span>
                    <span className="hero-stat__label">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {actions ? <div className="hero-actions">{actions}</div> : null}
            {channels.length > 0 ? <HeroChannelLinks channels={channels} /> : null}
          </div>
          {aside ? <div className="site-hero__aside">{aside}</div> : null}
        </div>
        {spotlight}
      </div>
    </section>
  );
}
