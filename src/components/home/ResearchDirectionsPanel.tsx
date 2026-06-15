import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeHighlight } from "@/types/lab";

type ResearchDirectionsPanelProps = {
  items: HomeHighlight[];
};

function isExternalLink(href: string, external?: boolean): boolean {
  return external ?? /^https?:\/\//.test(href);
}

// Renders description text, turning inline `[Method](href)` tokens into
// highlighted method links. Internal hrefs use next/link; external open in a
// new tab. Everything else stays plain text.
function renderDescription(content: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > cursor) nodes.push(content.slice(cursor, match.index));
    const [, label, href] = match;
    const key = `method-${index++}`;
    nodes.push(
      isExternalLink(href) ? (
        <a key={key} href={href} className="direction-card__method" target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ) : (
        <Link key={key} href={href} className="direction-card__method">
          {label}
        </Link>
      ),
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < content.length) nodes.push(content.slice(cursor));
  return nodes;
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
      <p className="direction-card__desc">{renderDescription(item.content)}</p>

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
