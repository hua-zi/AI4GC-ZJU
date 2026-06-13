import Link from "next/link";
import type { SiteConfig } from "@/types/lab";

type SiteFooterProps = Pick<SiteConfig, "name" | "tagline" | "nav" | "footer">;

export default function SiteFooter({ name, tagline, nav, footer }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer__inner">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link href="/" className="site-footer__name">
              {name}
            </Link>
            {tagline ? <p className="site-footer__tagline">{tagline}</p> : null}
          </div>

          <nav className="site-footer__nav" aria-label="Footer navigation">
            <ul className="site-footer__nav-list">
              {nav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="site-footer__nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {footer.externalLinks.length > 0 ? (
              <ul className="site-footer__nav-list site-footer__nav-list--external">
                {footer.externalLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="site-footer__nav-link site-footer__nav-link--muted"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </nav>
        </div>

        <div className="site-footer__meta">
          <p className="site-footer__credit">
            Copyright {name}.{footer.credit ? ` ${footer.credit}` : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
