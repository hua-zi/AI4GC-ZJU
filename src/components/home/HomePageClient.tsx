"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import HeroBanner from "@/components/HeroBanner";
import HomeHeroMotion from "@/components/home/HomeHeroMotion";
import HomeModules from "@/components/home/HomeModules";
import ContentSection from "@/components/layout/ContentSection";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { HomeContent, NewsItem } from "@/types/lab";

type HomePageClientProps = {
  home: HomeContent;
  newsItems: NewsItem[];
  defaultNewsLimit: number;
  githubStars: GitHubStarsMap;
};

export default function HomePageClient({
  home,
  newsItems,
  defaultNewsLimit,
  githubStars,
}: HomePageClientProps) {
  return (
    <main className="home-page">
      <HomeHeroMotion>
        <HeroBanner
          title={home.hero.title}
          subtitle={home.hero.subtitle}
          kicker={home.hero.kicker}
          backgroundImage={home.hero.backgroundImage}
          channels={home.hero.channels}
          aside={
            home.hero.brandMark ? (
              <div
                className="site-hero__brand-mark-frame"
                style={
                  {
                    "--brand-mark-src": `url("${home.hero.brandMark}")`,
                  } as CSSProperties
                }
              >
                <Image
                  src={home.hero.brandMark}
                  alt={`${home.hero.title} mark`}
                  width={847}
                  height={766}
                  className="site-hero__brand-mark"
                  priority
                />
                <span className="site-hero__brand-mark-flow" aria-hidden="true" />
              </div>
            ) : undefined
          }
          actions={
            home.hero.actions.length > 0 ? (
              <>
                {home.hero.actions.map((action, index) => {
                  const className =
                    index === 0
                      ? "hero-button hero-button--primary"
                      : "hero-button hero-button--secondary";
                  const external =
                    action.external ?? /^https?:\/\//.test(action.href);

                  if (external) {
                    return (
                      <a
                        key={action.href}
                        href={action.href}
                        className={className}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {action.label}
                      </a>
                    );
                  }

                  return (
                    <Link key={action.href} href={action.href} className={className}>
                      {action.label}
                    </Link>
                  );
                })}
              </>
            ) : undefined
          }
        />
      </HomeHeroMotion>

      <ContentSection className="section-home-body">
        <HomeModules
          modules={home.modules}
          newsItems={newsItems}
          defaultNewsLimit={defaultNewsLimit}
          githubStars={githubStars}
        />
      </ContentSection>
    </main>
  );
}
