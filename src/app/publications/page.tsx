import ContentSection from "@/components/layout/ContentSection";
import PublicationEntry from "@/components/site/PublicationEntry";
import { getPublications } from "@/lib/content";
import { collectGitHubHrefsFromPublications, fetchGitHubStarsMap } from "@/lib/github-stars";
import { groupPublicationsByYear } from "@/lib/publications-utils";

export default async function PublicationsPage() {
  const publications = getPublications();
  const publicationsByYear = groupPublicationsByYear(publications);
  const githubStars = await fetchGitHubStarsMap(collectGitHubHrefsFromPublications(publications));

  return (
    <main>
      <ContentSection className="section-page-body">
        {publicationsByYear.map(([year, items]) => (
          <section key={year} className="publication-year-group">
            <h2 className="publication-year-group__heading">{year > 0 ? year : "Other"}</h2>
            {items.map((pub) => (
              <PublicationEntry key={pub.id} pub={pub} githubStars={githubStars} />
            ))}
          </section>
        ))}
      </ContentSection>
    </main>
  );
}
