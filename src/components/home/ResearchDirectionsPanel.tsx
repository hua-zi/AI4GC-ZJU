import Link from "next/link";
import type { HomeHighlight } from "@/types/lab";

type ResearchDirectionsPanelProps = {
  items: HomeHighlight[];
};

function isExternalLink(href: string, external?: boolean): boolean {
  return external ?? /^https?:\/\//.test(href);
}

function DirectionCta({ label, href, external }: { label: string; href: string; external: boolean }) {
  const content = (
    <>
      {label}
      <span className="direction-card__cta-arrow" aria-hidden="true">
        →
      </span>
    </>
  );

  if (external) {
    return (
      <a href={href} className="direction-card__cta" target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="direction-card__cta">
      {content}
    </Link>
  );
}

function DirectionCard({ item }: { item: HomeHighlight }) {
  return (
    <article className="direction-card">
      <h3 className="direction-card__title">{item.label}</h3>
      <p className="direction-card__desc">{item.content}</p>

      {item.links.length > 0 ? (
        <footer className="direction-card__footer">
          {item.links.map((link) => (
            <DirectionCta
              key={link.href}
              label={link.label}
              href={link.href}
              external={isExternalLink(link.href, link.external)}
            />
          ))}
        </footer>
      ) : null}
    </article>
  );
}

export default function ResearchDirectionsPanel({ items }: ResearchDirectionsPanelProps) {
  return (
    <ul className="direction-grid">
      {items.map((item) => (
        <li key={item.id} className="direction-grid__item">
          <DirectionCard item={item} />
        </li>
      ))}
    </ul>
  );
}
