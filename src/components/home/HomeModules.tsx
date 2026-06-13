"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HomeReveal from "@/components/home/HomeReveal";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import PartnerMarquee from "@/components/home/PartnerMarquee";
import ProjectsPanel from "@/components/home/ProjectsPanel";
import ResearchDirectionsPanel from "@/components/home/ResearchDirectionsPanel";
import MarkdownBody from "@/components/markdown/MarkdownBody";
import NewsFeed from "@/components/site/NewsFeed";
import { filterNews } from "@/lib/content/filter-news";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { HomeModule, NewsItem } from "@/types/lab";

type HomeModulesProps = {
  modules: HomeModule[];
  newsItems: NewsItem[];
  defaultNewsLimit: number;
  githubStars: GitHubStarsMap;
};

function isExternalLink(href: string, external?: boolean): boolean {
  return external ?? /^https?:\/\//.test(href);
}

function HighlightsModule({
  module,
  githubStars,
}: {
  module: Extract<HomeModule, { type: "highlights" }>;
  githubStars: GitHubStarsMap;
}) {
  return (
    <HomeReveal className="home-section">
      <section className="home-section__inner">
        <HomeSectionHeader title={module.title} />
        <ResearchDirectionsPanel items={module.items} githubStars={githubStars} />
      </section>
    </HomeReveal>
  );
}

function ProseModule({ module }: { module: Extract<HomeModule, { type: "prose" }> }) {
  return (
    <HomeReveal className="home-section">
      <section className="home-section__inner">
        <HomeSectionHeader title={module.title} />
        <div className="home-prose-block">
          {module.markdown ? (
            <MarkdownBody content={module.markdown} variant="home" />
          ) : (
            module.body?.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="prose-copy">
                {paragraph}
              </p>
            ))
          )}
        </div>
      </section>
    </HomeReveal>
  );
}

function LinksModule({ module }: { module: Extract<HomeModule, { type: "links" }> }) {
  return (
    <HomeReveal className="home-section">
      <section className="home-section__inner">
        <HomeSectionHeader title={module.title} />
        <div className="home-links-block link-row">
          {module.links.map((link) => {
            const external = isExternalLink(link.href, link.external);
            return external ? (
              <a
                key={link.href}
                href={link.href}
                className="site-link site-link--inline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="site-link site-link--inline">
                {link.label}
              </Link>
            );
          })}
        </div>
      </section>
    </HomeReveal>
  );
}

function ProjectsModule({
  module,
  githubStars,
}: {
  module: Extract<HomeModule, { type: "projects" }>;
  githubStars: GitHubStarsMap;
}) {
  return (
    <HomeReveal className="home-section">
      <section className="home-section__inner">
        <HomeSectionHeader title={module.title} />
        <ProjectsPanel projects={module.items} githubStars={githubStars} />
      </section>
    </HomeReveal>
  );
}

function PartnersModule({ module }: { module: Extract<HomeModule, { type: "partners" }> }) {
  return (
    <HomeReveal className="home-section home-section--partners">
      <section className="home-section__inner">
        <HomeSectionHeader title={module.title} />
        <div className="home-partners-scroll">
          <PartnerMarquee partners={module.items} />
        </div>
      </section>
    </HomeReveal>
  );
}

function NewsModule({
  module,
  newsItems,
  defaultNewsLimit,
  githubStars,
}: {
  module: Extract<HomeModule, { type: "news" }>;
  newsItems: NewsItem[];
  defaultNewsLimit: number;
  githubStars: GitHubStarsMap;
}) {
  const [showAll, setShowAll] = useState(false);
  const limit = module.limit ?? defaultNewsLimit;

  const allFiltered = useMemo(
    () => filterNews(newsItems, { filter: module.source }),
    [module.source, newsItems],
  );

  const visibleItems = showAll ? allFiltered : allFiltered.slice(0, limit);
  const canLoadMore = module.loadMore.enabled && allFiltered.length > limit && !showAll;

  return (
    <HomeReveal className="home-section">
      <section className="home-section__inner">
        <HomeSectionHeader title={module.title} />
        <NewsFeed
          items={visibleItems}
          githubStars={githubStars}
          className="news-stack--home"
        />
        {canLoadMore ? (
          <div className="section-actions">
            <button
              type="button"
              className="hero-button hero-button--secondary"
              onClick={() => setShowAll(true)}
            >
              {module.loadMore.label}
            </button>
          </div>
        ) : null}
      </section>
    </HomeReveal>
  );
}

export default function HomeModules({
  modules,
  newsItems,
  defaultNewsLimit,
  githubStars,
}: HomeModulesProps) {
  return (
    <>
      {modules.map((module) => {
        switch (module.type) {
          case "highlights":
            return (
              <HighlightsModule key={module.id} module={module} githubStars={githubStars} />
            );
          case "news":
            return (
              <NewsModule
                key={module.id}
                module={module}
                newsItems={newsItems}
                defaultNewsLimit={defaultNewsLimit}
                githubStars={githubStars}
              />
            );
          case "prose":
            return <ProseModule key={module.id} module={module} />;
          case "links":
            return <LinksModule key={module.id} module={module} />;
          case "projects":
            return (
              <ProjectsModule key={module.id} module={module} githubStars={githubStars} />
            );
          case "partners":
            return <PartnersModule key={module.id} module={module} />;
          default: {
            const _exhaustive: never = module;
            return _exhaustive;
          }
        }
      })}
    </>
  );
}
