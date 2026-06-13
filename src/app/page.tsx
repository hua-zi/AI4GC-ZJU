import HomePageClient from "@/components/home/HomePageClient";
import { collectGitHubHrefsFromHome, fetchGitHubStarsMap } from "@/lib/github-stars";
import { getHomeContent, getNewsItems, getSiteConfig } from "@/lib/content";

export default async function HomePage() {
  const home = getHomeContent();
  const site = getSiteConfig();
  const githubStars = await fetchGitHubStarsMap(collectGitHubHrefsFromHome(home));

  return (
    <HomePageClient
      home={home}
      newsItems={getNewsItems()}
      defaultNewsLimit={site.featuredNewsCount}
      githubStars={githubStars}
    />
  );
}
