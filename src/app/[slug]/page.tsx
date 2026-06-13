import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfilePageContent from "@/components/profile/ProfilePageContent";
import { getSiteConfig } from "@/lib/content";
import { filterHeroMemberLinks } from "@/lib/content/member-blog-channels";
import { resolveProfileSegmentsWithBlog } from "@/lib/content/profile-blog";
import { listMemberProfileSlugs, loadMemberProfile } from "@/lib/content/load-team";
import { collectGitHubHrefsFromPublications, fetchGitHubStarsMap } from "@/lib/github-stars";
import type { ProfileBodySegment } from "@/lib/content/resolve-profile-papers";
import type { PublicationItem } from "@/types/lab";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function collectProfilePublications(segments: ProfileBodySegment[]): PublicationItem[] {
  return segments.flatMap((segment) =>
    segment.kind === "papers" ? segment.publications : [],
  );
}

export function generateStaticParams() {
  return listMemberProfileSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = loadMemberProfile(slug);
  if (!profile) {
    return {};
  }

  const site = getSiteConfig();

  return {
    title: `${profile.member.name} | ${site.name}`,
    description: profile.member.bio,
  };
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = loadMemberProfile(slug);
  if (!profile) {
    notFound();
  }

  const site = getSiteConfig();
  const heroLinks = filterHeroMemberLinks(profile.member.links);
  const pathLabel = `content/team/${profile.group}/${profile.slug}/`;
  const profilePublications = collectProfilePublications(profile.segments);
  const githubStars = await fetchGitHubStarsMap(
    collectGitHubHrefsFromPublications(profilePublications),
  );
  const segments = resolveProfileSegmentsWithBlog(
    profile.member.id,
    profile.segments,
    profile.member.links,
    pathLabel,
  );

  return (
    <ProfilePageContent
      profile={{ ...profile, segments }}
      siteName={site.name}
      heroLinks={heroLinks}
      githubStars={githubStars}
    />
  );
}
