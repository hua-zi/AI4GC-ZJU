import Image from "next/image";
import LinkChip from "@/components/site/LinkChip";
import { getNewsLinks } from "@/lib/content/news-links";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { NewsItem } from "@/types/lab";

type HeroSpotlightRailProps = {
  label: string;
  item: NewsItem;
  githubStars: GitHubStarsMap;
};

export default function HeroSpotlightRail({ label, item, githubStars }: HeroSpotlightRailProps) {
  const links = getNewsLinks(item);
  const imageAlt = item.imageAlt ?? item.title;

  return (
    <div className="hero-spotlight" role="region" aria-label={label}>
      <div className="hero-spotlight__inner">
        {item.image ? (
          <div className="hero-spotlight__thumb">
            <Image
              src={item.image}
              alt={imageAlt}
              fill
              className="hero-spotlight__cover"
              sizes="(min-width: 768px) 88px, 64px"
              priority
            />
          </div>
        ) : null}
        <div className="hero-spotlight__copy">
          <p className="hero-spotlight__meta">
            <span>{label}</span>
            <span className="hero-spotlight__sep" aria-hidden="true">
              ·
            </span>
            <time dateTime={item.date}>{item.date}</time>
          </p>
          <p className="hero-spotlight__title">{item.title}</p>
          <p className="hero-spotlight__hook">{item.desc}</p>
        </div>
        {links.length > 0 ? (
          <div className="site-link-chip-list hero-spotlight__links">
            {links.map((link) => (
              <LinkChip key={`${link.label}-${link.href}`} link={link} githubStars={githubStars} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
