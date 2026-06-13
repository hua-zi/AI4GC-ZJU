import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContentSectionProps = {
  children: ReactNode;
  muted?: boolean;
  title?: ReactNode;
  eyebrow?: ReactNode;
  soft?: boolean;
  className?: string;
};

export default function ContentSection({
  children,
  muted = false,
  title,
  eyebrow,
  soft = false,
  className,
}: ContentSectionProps) {
  return (
    <section
      className={cn(
        "site-section",
        muted && "site-section--muted",
        soft && "site-section--soft",
        className,
      )}
    >
      <div className="site-container">
        {eyebrow ? <p className="site-lead site-eyebrow">{eyebrow}</p> : null}
        {title ? <h1 className="site-page-title">{title}</h1> : null}
        <div className="section-shell">{children}</div>
      </div>
    </section>
  );
}
