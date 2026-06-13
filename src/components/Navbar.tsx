"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { LinkItem } from "@/types/lab";

type NavbarProps = {
  name: string;
  logo: string;
  schoolLogo?: string;
  schoolName: string;
  schoolHref: string;
  nav: LinkItem[];
};

export default function Navbar({
  name,
  logo,
  schoolLogo,
  schoolName,
  schoolHref,
  nav,
}: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="site-container site-nav__inner">
        <div className="site-nav__brand">
          {schoolLogo ? (
            <a
              href={schoolHref}
              className="site-nav__school-logo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={schoolName}
            >
              <Image
                src={schoolLogo}
                alt=""
                width={88}
                height={88}
                className="site-nav__school-logo-img"
                priority
              />
            </a>
          ) : null}
          <Link href="/" className="site-nav__logo" onClick={closeMenu}>
            <Image src={logo} alt={name} width={847} height={766} priority />
          </Link>
        </div>

        <button
          type="button"
          className="site-nav__toggle"
          aria-expanded={open}
          aria-controls="site-nav-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" size={22} strokeWidth={2} /> : <Menu aria-hidden="true" size={22} strokeWidth={2} />}
          <span className="site-nav__toggle-label">{open ? "Close menu" : "Open menu"}</span>
        </button>

        <div
          id="site-nav-menu"
          className={cn("site-nav__panel", open && "site-nav__panel--open")}
        >
          <div className="site-nav__links">
            {nav.map((link) => {
              const isActive =
                !link.external &&
                (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));

              if (link.external) {
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="site-link site-link--quiet site-nav__menu-link"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={
                    isActive
                      ? "site-nav__link site-nav__link--active site-nav__menu-link"
                      : "site-nav__link site-nav__menu-link"
                  }
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
