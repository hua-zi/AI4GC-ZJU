#!/usr/bin/env node
/**
 * Migrates monolithic content/*.yaml to the split layout:
 *   content/news/*.yaml
 *   content/team/{pi,postdocs,phds,masters,undergrads,alumni}/*.yaml
 *   content/publications.bib
 *   content/site.yaml
 *   content/pages/songhan.yaml
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { stringify } from "yaml";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

async function main() {
  const { parse } = await import("yaml");

  function load(name) {
    const filePath = path.join(CONTENT, name);
    if (!existsSync(filePath)) {
      console.warn(`Skip missing ${name}`);
      return null;
    }
    return parse(readFileSync(filePath, "utf-8"));
  }

  function slugify(text, maxLength = 48) {
    const base = String(text)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, maxLength);
    return base || "item";
  }

  function memberSlug(name) {
    return slugify(name.replace(/\./g, ""));
  }

  function newsSlug(item) {
    const source = (item.title || "").trim() || item.desc.slice(0, 40);
    const year = String(item.date).trim().split(/\s+/).pop() ?? "";
    const shortYear = year.length === 4 ? year.slice(2) : year;
    const base = slugify(source, 36);
    return shortYear ? `${base}-${shortYear}` : base;
  }

  function publicationBibKey(title, venue) {
    const yearMatch = String(venue).match(/\b(19|20)\d{2}\b/);
    const year = yearMatch?.[0] ?? "0000";
    const words = slugify(title, 60).split("-").filter(Boolean);
    const short = words.slice(0, 2).join("") || "paper";
    return `${short}${year}`;
  }

  function writeYaml(filePath, data) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    const body = stringify(data, { lineWidth: 0 });
    writeFileSync(filePath, `# ${path.basename(filePath)} — edit and commit; site rebuilds on deploy.\n\n${body}`);
  }

  function omitId(obj) {
    const copy = { ...obj };
    delete copy.id;
    return copy;
  }

  // --- News ---
  const news = load("news.yaml");
  const usedNewsSlugs = new Set();
  if (Array.isArray(news)) {
    const newsDir = path.join(CONTENT, "news");
    mkdirSync(newsDir, { recursive: true });

    for (const item of news) {
      let slug = newsSlug(item);
      let suffix = 1;
      while (usedNewsSlugs.has(slug)) {
        slug = `${newsSlug(item)}-${suffix++}`;
      }
      usedNewsSlugs.add(slug);
      writeYaml(path.join(newsDir, `${slug}.yaml`), omitId(item));
    }
    console.log(`Wrote ${news.length} news files`);
  }

  // --- Team ---
  const team = load("team.yaml");
  if (team && typeof team === "object") {
    const teamDir = path.join(CONTENT, "team");
    const groups = ["postdocs", "phds", "masters", "undergrads", "alumni"];

    if (team.pi) {
      const piSlug = memberSlug(team.pi.name);
      writeYaml(path.join(teamDir, "pi", `${piSlug}.yaml`), omitId(team.pi));
    }

    for (const group of groups) {
      const members = team[group];
      if (!Array.isArray(members)) continue;
      for (const member of members) {
        const slug = memberSlug(member.name);
        writeYaml(path.join(teamDir, group, `${slug}.yaml`), omitId(member));
      }
      console.log(`Wrote ${members.length} ${group} files`);
    }
  }

  // --- Publications.bib ---
  const publications = load("publications.yaml");
  if (Array.isArray(publications)) {
    const usedKeys = new Set();
    const lines = [
      "% publications.bib — edit and commit; site rebuilds on deploy.",
      "% Export from Zotero/Better BibTeX or edit manually.",
      "",
    ];

    for (const pub of publications) {
      let key = publicationBibKey(pub.title, pub.venue);
      let suffix = 1;
      while (usedKeys.has(key)) {
        key = `${publicationBibKey(pub.title, pub.venue)}${suffix++}`;
      }
      usedKeys.add(key);

      const yearMatch = String(pub.venue).match(/\b(19|20)\d{2}\b/);
      const year = yearMatch?.[0] ?? "";
      const booktitle = pub.venue.replace(/\s+(19|20)\d{2}\b.*$/, "").trim() || pub.venue;

      lines.push(`@inproceedings{${key},`);
      lines.push(`  title={${pub.title.replace(/[{}]/g, "")}},`);
      lines.push(`  author={${pub.authors.replace(/\*/g, "").replace(/¹|²/g, "")}},`);
      if (year) lines.push(`  year={${year}},`);
      lines.push(`  booktitle={${booktitle}},`);
      if (pub.href) lines.push(`  url={${pub.href}},`);
      lines.push(`}`);
      lines.push("");
    }

    writeFileSync(path.join(CONTENT, "publications.bib"), lines.join("\n"));
    console.log(`Wrote ${publications.length} bib entries`);
  }

  // --- site.yaml ---
  const home = load("home.yaml");
  writeYaml(path.join(CONTENT, "site.yaml"), {
    featuredNewsCount: home?.featuredNewsCount ?? 4,
    team: {
      openings: team?.openings ?? null,
      sponsors: team?.sponsors ?? null,
    },
  });

  // --- home.yaml (strip featuredNewsCount) ---
  if (home) {
    const homeBody = { ...home };
    delete homeBody.featuredNewsCount;
    writeYaml(path.join(CONTENT, "home.yaml"), homeBody);
  }

  // --- songhan page ---
  const songhan = load("songhan.yaml");
  if (songhan) {
    const page = { ...songhan };
    delete page.newsIds;
    writeYaml(path.join(CONTENT, "pages", "songhan.yaml"), {
      ...page,
      news: { filter: "featured", limit: 5 },
    });
  }

  // --- Remove legacy monolithic files ---
  for (const legacy of ["news.yaml", "publications.yaml", "team.yaml", "songhan.yaml"]) {
    const legacyPath = path.join(CONTENT, legacy);
    if (existsSync(legacyPath)) {
      rmSync(legacyPath);
      console.log(`Removed ${legacy}`);
    }
  }

  console.log("Migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
