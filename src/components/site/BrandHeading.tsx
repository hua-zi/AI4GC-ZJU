import type { ReactNode } from "react";

interface BrandHeadingProps {
  children: ReactNode;
  kicker?: string;
  color?: "primary" | "neutral";
}

export default function BrandHeading({ children, color = "primary", kicker }: BrandHeadingProps) {
  return (
    <div className="site-heading-block">
      {kicker ? <p className="site-heading-block__kicker">{kicker}</p> : null}
      <h2 className={`site-section-title ${color === "primary" ? "site-section-title--primary" : "site-section-title--neutral"}`}>
        {children}
      </h2>
    </div>
  );
}
