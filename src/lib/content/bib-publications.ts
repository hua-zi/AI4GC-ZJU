import { existsSync, readFileSync } from "fs";
import { parse as parseBib, type BibEntry } from "@retorquere/bibtex-parser";
import { publicationItemSchema } from "@/lib/content/schema";
import { normalizeHonorLabel, normalizeVenueLabel } from "@/lib/publications-utils";
import type { LinkItem, PublicationItem } from "@/types/lab";

type BibAuthor =
  | string
  | {
      lastName?: string;
      firstName?: string;
      von?: string;
      jr?: string;
    };

function formatAuthor(author: BibAuthor): string {
  if (typeof author === "string") {
    return author;
  }

  const parts = [author.von, author.firstName, author.lastName, author.jr].filter(Boolean);
  return parts.join(" ").trim();
}

function formatAuthors(authors: BibAuthor[] | string | undefined): string {
  if (!authors) return "";
  if (typeof authors === "string") return authors;
  return authors.map(formatAuthor).join(", ");
}

function fieldToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(fieldToString).join(" ");
  return "";
}

function extractYear(fields: Record<string, unknown>): string {
  const year = fieldToString(fields.year);
  if (year) return year;

  for (const key of ["booktitle", "journal", "venue"]) {
    const match = fieldToString(fields[key]).match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }

  return "";
}

function extractVenue(fields: Record<string, unknown>): string {
  const raw =
    fieldToString(fields.booktitle) ||
    fieldToString(fields.journal) ||
    fieldToString(fields.venue) ||
    fieldToString(fields.howpublished);

  return normalizeVenueLabel(raw);
}

function normalizeDoi(doi: string): string {
  const trimmed = doi.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://doi.org/${trimmed.replace(/^doi:/i, "")}`;
}

function firstNonEmptyField(fields: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = fieldToString(fields[key]).trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function extractPublicationLinks(fields: Record<string, unknown>): LinkItem[] {
  const links: LinkItem[] = [];

  const url = fieldToString(fields.url).trim();
  const doi = fieldToString(fields.doi).trim();
  const paperHref = url || (doi ? normalizeDoi(doi) : "");

  if (paperHref) {
    links.push({ label: "Paper", href: paperHref, external: true });
  }

  const github = firstNonEmptyField(fields, ["github", "code", "codeurl", "repository"]);
  if (github) {
    links.push({ label: "Project", href: github, external: true });
  }

  return links;
}

export function publicationFromBibEntry(entry: BibEntry): PublicationItem {
  const fields = entry.fields as Record<string, unknown>;
  const title = fieldToString(fields.title);
  const venue = extractVenue(fields);
  const year = extractYear(fields);
  const links = extractPublicationLinks(fields);
  const paperHref = links.find((link) => link.label === "Paper")?.href;
  const honor = firstNonEmptyField(fields, ["honor", "award", "presentation"]);

  return publicationItemSchema.parse({
    id: entry.key,
    title,
    authors: formatAuthors(fields.author as BibAuthor[] | string | undefined),
    venue: year && !venue.includes(year) ? `${venue} ${year}`.trim() : venue,
    href: paperHref,
    honor: honor ? normalizeHonorLabel(honor) : undefined,
    links,
  });
}

export function loadPublicationsFromBibFile(bibPath: string): PublicationItem[] {
  if (!existsSync(bibPath)) {
    throw new Error(`Missing BibTeX file: ${bibPath}`);
  }

  const raw = readFileSync(bibPath, "utf-8");
  const parsed = parseBib(raw);

  return parsed.entries.map(publicationFromBibEntry);
}

export function loadPublicationsFromBibKeys(bibPath: string, keys: string[]): PublicationItem[] {
  const all = loadPublicationsFromBibFile(bibPath);
  const byId = new Map(all.map((item) => [item.id, item]));

  return keys.map((key) => {
    const item = byId.get(key);
    if (!item) {
      throw new Error(`Missing BibTeX entry "${key}" in ${bibPath}`);
    }
    return item;
  });
}

export function extractYearFromPublicationId(id: string): number {
  const match = id.match(/\b(19|20)\d{2}\b/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

export function sortPublicationsByYear(items: PublicationItem[]): PublicationItem[] {
  return [...items].sort((a, b) => {
    const yearA = extractYearFromPublicationId(a.id) || extractYearFromPublicationId(a.venue);
    const yearB = extractYearFromPublicationId(b.id) || extractYearFromPublicationId(b.venue);
    return yearB - yearA;
  });
}
