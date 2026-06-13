import LinkChip from "@/components/site/LinkChip";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { HomeHighlight } from "@/types/lab";

type ResearchDirectionsPanelProps = {
  items: HomeHighlight[];
  githubStars?: GitHubStarsMap;
};

function DirectionCard({
  item,
  githubStars,
}: {
  item: HomeHighlight;
  githubStars?: GitHubStarsMap;
}) {
  return (
    <article className="direction-card">
      <h3 className="direction-card__title">{item.label}</h3>
      <p className="direction-card__desc">{item.content}</p>

      {item.links.length > 0 ? (
        <footer className="direction-card__footer">
          <div className="site-link-chip-list">
            {item.links.map((link) => (
              <LinkChip key={link.href} link={link} githubStars={githubStars} />
            ))}
          </div>
        </footer>
      ) : null}
    </article>
  );
}

export default function ResearchDirectionsPanel({
  items,
  githubStars,
}: ResearchDirectionsPanelProps) {
  return (
    <ul className="direction-grid">
      {items.map((item) => (
        <li key={item.id} className="direction-grid__item">
          <DirectionCard item={item} githubStars={githubStars} />
        </li>
      ))}
    </ul>
  );
}
