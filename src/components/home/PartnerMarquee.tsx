"use client";

import Image from "next/image";
import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";
import type { HomePartner } from "@/types/lab";

type PartnerMarqueeProps = {
  partners: HomePartner[];
};

function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function partnerAriaLabel(partner: HomePartner): string {
  if (partner.kind === "person" && partner.affiliation) {
    return `${partner.name}, ${partner.affiliation}`;
  }
  return partner.name;
}

function PartnerOrgMark({ partner }: { partner: HomePartner }) {
  if (partner.logo) {
    return (
      <span className="partner-marquee__org">
        <span className="partner-marquee__logo-wrap">
          {/* Local SVG logos: plain img preserves each file's viewBox aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={partner.logo} alt="" aria-hidden className="partner-marquee__logo" />
        </span>
        <span className="partner-marquee__label">{partner.name}</span>
      </span>
    );
  }

  return <span className="partner-marquee__label">{partner.name}</span>;
}

function PartnerPersonMark({ partner }: { partner: HomePartner }) {
  const initials = getInitials(partner.name);

  return (
    <span className="partner-marquee__person">
      {partner.photo ? (
        <Image
          src={partner.photo}
          alt=""
          aria-hidden
          width={64}
          height={64}
          className="partner-marquee__avatar"
          sizes="64px"
        />
      ) : (
        <span className="partner-marquee__avatar partner-marquee__avatar--fallback" aria-hidden>
          {initials}
        </span>
      )}
      <span className="partner-marquee__person-text">
        <span className="partner-marquee__person-name">{partner.name}</span>
        {partner.affiliation ? (
          <span className="partner-marquee__person-affiliation">{partner.affiliation}</span>
        ) : null}
      </span>
    </span>
  );
}

function PartnerMarqueeItem({ partner }: { partner: HomePartner }) {
  const isPerson = partner.kind === "person";
  const markClass = cn(
    "partner-marquee__mark",
    isPerson ? "partner-marquee__mark--person" : "partner-marquee__mark--org",
    partner.kind === "lab" && "partner-marquee__mark--lab",
    partner.href && "partner-marquee__mark--link",
  );
  const content = isPerson ? (
    <PartnerPersonMark partner={partner} />
  ) : (
    <PartnerOrgMark partner={partner} />
  );

  if (partner.href) {
    const external = isExternalHref(partner.href);
    return (
      <a
        href={partner.href}
        className={markClass}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-label={partnerAriaLabel(partner)}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={markClass} aria-label={partnerAriaLabel(partner)}>
      {content}
    </div>
  );
}

export default function PartnerMarquee({ partners }: PartnerMarqueeProps) {
  const loop = [...partners, ...partners];

  return (
    <div className="partner-marquee" role="region" aria-label="Collaborators and partners">
      <div className="partner-marquee__viewport">
        <ul className="partner-marquee__track">
          {loop.map((partner, index) => (
            <li
              key={`${partner.id}-${index}`}
              className={cn(
                "partner-marquee__item",
                partner.kind === "person" && "partner-marquee__item--person",
              )}
            >
              <PartnerMarqueeItem partner={partner} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
