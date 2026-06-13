import ContentSection from "@/components/layout/ContentSection";
import MemberAvatar from "@/components/site/MemberAvatar";
import MemberMarkdown from "@/components/site/MemberMarkdown";
import PiProfileHero from "@/components/profile/PiProfileHero";
import HeroBanner from "@/components/HeroBanner";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { LinkItem, MemberProfile } from "@/types/lab";

type ProfilePageContentProps = {
  profile: MemberProfile;
  siteName: string;
  heroLinks: LinkItem[];
  githubStars: GitHubStarsMap;
};

export default function ProfilePageContent({
  profile,
  siteName,
  heroLinks,
  githubStars,
}: ProfilePageContentProps) {
  const { member, segments, group } = profile;
  const isPi = group === "pi";

  if (isPi) {
    return (
      <main className="profile-route profile-route--pi">
        <PiProfileHero
          name={member.name}
          photo={member.photo}
          degree={member.degree}
          backgroundImage={member.heroBackground}
          tags={member.tags}
          links={heroLinks}
          email={member.email}
        />

        <ContentSection className="section-page-body section-page-body--profile section-page-body--profile-pi">
          <div className="profile-page profile-page--pi">
            {segments.length > 0 ? (
              <MemberMarkdown segments={segments} githubStars={githubStars} variant="pi" />
            ) : (
              <article className="profile-markdown profile-markdown--pi">
                <p className="profile-markdown-body__p">{member.bio}</p>
              </article>
            )}
          </div>
        </ContentSection>
      </main>
    );
  }

  return (
    <main className="profile-route profile-route--member">
      <HeroBanner
        title={member.name}
        kicker={siteName}
        tags={member.tags}
        links={heroLinks}
        email={member.email}
        compact
        lead={(
          <div className="hero-profile">
            <MemberAvatar src={member.photo} name={member.name} size="lg" />
          </div>
        )}
      />

      <ContentSection className="section-page-body section-page-body--profile section-page-body--profile-member">
        <div className="profile-page profile-page--member">
          {segments.length > 0 ? (
            <MemberMarkdown segments={segments} githubStars={githubStars} variant="member" />
          ) : (
            <article className="profile-markdown profile-markdown--member">
              <p className="profile-markdown-body__p">{member.bio}</p>
            </article>
          )}
        </div>
      </ContentSection>
    </main>
  );
}
