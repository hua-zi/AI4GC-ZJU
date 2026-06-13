import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/site/SiteFooter";
import { getSiteConfig } from "@/lib/content";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const site = getSiteConfig();
  return {
    title: site.name,
    description: site.description,
    icons: {
      icon: site.favicon,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = getSiteConfig();
  const headerList = await headers();
  const isAdminRoute = headerList.get("x-admin-route") === "1";

  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${sourceSans.variable} ${ibmPlexMono.variable}`}
    >
      <body
        className={
          isAdminRoute
            ? "admin-body font-body antialiased"
            : "surface-shell flex min-h-dvh flex-col font-body antialiased"
        }
      >
        {!isAdminRoute ? (
          <Navbar
            name={site.name}
            logo={site.logo}
            schoolLogo={site.schoolLogo}
            schoolName={site.schoolName}
            schoolHref={site.schoolHref}
            nav={site.nav}
          />
        ) : null}
        {children}
        {!isAdminRoute ? (
          <SiteFooter
            name={site.name}
            tagline={site.tagline}
            nav={site.nav}
            footer={site.footer}
          />
        ) : null}
      </body>
    </html>
  );
}
