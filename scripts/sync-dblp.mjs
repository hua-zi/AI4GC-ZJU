#!/usr/bin/env node
/**
 * Keeps content/publications.bib in sync with the PI's DBLP record.
 *
 *   node scripts/sync-dblp.mjs            # report: author/DOI drift + NEW published papers
 *   node scripts/sync-dblp.mjs --apply    # also append the NEW published papers to the bib
 *   node scripts/sync-dblp.mjs --pid 47/3459-1
 *
 * Report mode never writes; exits non-zero when drift is found (for CI).
 * Uses curl (honors http(s)_proxy, which Node's fetch ignores).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";

const ROOT = process.cwd();
const BIB = path.join(ROOT, "content/publications.bib");
const APPLY = process.argv.includes("--apply");
const pidArg = process.argv.indexOf("--pid");
const PID = pidArg !== -1 ? process.argv[pidArg + 1] : process.env.DBLP_PID || "47/3459-1";

function decode(s) {
  return (s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/\s+/g, " ").trim();
}

const normTitle = (t) =>
  decode(t).toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
const normName = (n) =>
  (n || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\s+\d{4}$/, "")
    .replace(/[^a-z0-9 ]/gi, "").toLowerCase().replace(/\s+/g, " ").trim();
const isPreprintVenue = (v) => /corr|arxiv|techrxiv/i.test(v || "");
// Non-archival items DBLP lists as inproceedings but that aren't regular papers.
const isMinorEntry = (title) =>
  /\(student abstract\)|\(doctoral consortium\)|\(demonstration[^)]*\)|\(poster[^)]*\)|\(extended abstract\)|\bworkshop$/i.test(title || "");

function curlText(url) {
  return execFileSync("curl", ["-s", "-m", "60", "-A", "ai4gc-website-dblp-sync/1.0", url], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

// --- parse existing bib ---
function parseBib(text) {
  const entries = [];
  const re = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)\n\}/g;
  let m;
  while ((m = re.exec(text))) {
    const fields = {};
    const fre = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let fm;
    while ((fm = fre.exec(m[3]))) fields[fm[1].toLowerCase()] = fm[2].trim();
    entries.push({ key: m[2].trim(), fields });
  }
  return entries;
}

// --- parse DBLP person XML into records ---
function parseDblp(xml) {
  const records = [];
  const re = /<(article|inproceedings|incollection)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let r;
  while ((r = re.exec(xml))) {
    const [, type, rec] = r;
    const year = Number((rec.match(/<year>(\d{4})<\/year>/) || [])[1] || 0);
    const venue =
      (rec.match(/<booktitle>([^<]*)<\/booktitle>/) || [])[1] ||
      (rec.match(/<journal>([^<]*)<\/journal>/) || [])[1] || "";
    const authors = [...rec.matchAll(/<author\b[^>]*>([^<]*)<\/author>/g)].map((a) =>
      decode(a[1]).replace(/\s+\d{4}$/, ""),
    );
    const title = decode((rec.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").replace(/\.$/, "");
    if (!title || authors.length === 0) continue;
    const ee = (rec.match(/<ee>([^<]*)<\/ee>/) || [])[1] || "";
    const doi = (ee.match(/doi\.org\/(.+)$/i) || [])[1] || "";
    records.push({ type, title, authors, year, venue: decode(venue), doi, ee, preprint: isPreprintVenue(venue) });
  }
  return records;
}

function slugKey(title, year, used) {
  const base = `${normTitle(title).split(" ").filter(Boolean).slice(0, 3).join("")}${year}`;
  let key = base, n = 2;
  while (used.has(key)) key = `${base}-${n++}`;
  used.add(key);
  return key;
}

function toBibtex(rec, used) {
  const key = slugKey(rec.title, rec.year, used);
  const lines = [`@${rec.type === "article" ? "article" : "inproceedings"}{${key},`];
  lines.push(`  title={${rec.title}},`);
  lines.push(`  author={${rec.authors.join(" and ")}},`);
  lines.push(`  year={${rec.year}},`);
  lines.push(`  ${rec.type === "article" ? "journal" : "booktitle"}={${rec.venue}},`);
  if (rec.ee) lines.push(`  url={${rec.ee}},`);
  if (rec.doi) lines.push(`  doi={${rec.doi}},`);
  lines.push("}");
  return lines.join("\n");
}

// --- main ---
if (!existsSync(BIB)) {
  console.error(`Missing ${BIB}`);
  process.exit(1);
}
let bib = readFileSync(BIB, "utf8");
const entries = parseBib(bib);
const usedKeys = new Set(entries.map((e) => e.key));
const bibByTitle = new Map(entries.map((e) => [normTitle(e.fields.title || ""), e]));

console.log(`Fetching DBLP pid ${PID} …`);
const records = parseDblp(curlText(`https://dblp.org/pid/${PID}.xml`));
console.log(`DBLP records: ${records.length}`);

// Diffs (author / official-DOI) for titles present in both
const diffs = [];
for (const rec of records) {
  const e = bibByTitle.get(normTitle(rec.title));
  if (!e) continue;
  const cur = (e.fields.author || "").split(/\s+and\s+/i).map((a) => a.trim()).filter(Boolean);
  const authorsSame =
    cur.length === rec.authors.length && cur.every((a, i) => normName(a) === normName(rec.authors[i]));
  const officialDoi = rec.doi && !/10\.48550\/arxiv/i.test(rec.doi);
  const doiDiff = officialDoi && (e.fields.doi || "").toLowerCase() !== rec.doi.toLowerCase();
  const parts = [];
  if (!authorsSame) parts.push(`     authors  bib: ${cur.join(", ")}\n     authors dblp: ${rec.authors.join(", ")}`);
  if (doiDiff) parts.push(`     doi  bib: ${e.fields.doi || "-"}  →  dblp: ${rec.doi}`);
  if (parts.length) diffs.push(`[DIFF] ${e.key}  (${rec.venue} ${rec.year})\n${parts.join("\n")}`);
}

// NEW = published DBLP papers not in the bib
const newPubs = records
  .filter((rec) => !rec.preprint && !isMinorEntry(rec.title) && !bibByTitle.has(normTitle(rec.title)))
  .sort((a, b) => b.year - a.year);

console.log(`\n========== DIFFS (review manually) — ${diffs.length} ==========`);
for (const d of diffs) console.log(d);
console.log(`\n========== NEW published papers on DBLP — ${newPubs.length} ==========`);
for (const r of newPubs) console.log(`[NEW] ${r.year}  ${r.title}  (${r.venue})`);

if (APPLY && newPubs.length > 0) {
  const block =
    "\n% ---- Added by sync-dblp.mjs (new published papers from DBLP) ----\n\n" +
    newPubs.map((r) => toBibtex(r, usedKeys)).join("\n\n") + "\n";
  writeFileSync(BIB, bib.replace(/\s*$/, "") + "\n" + block);
  console.log(`\n✓ Appended ${newPubs.length} new published entries to content/publications.bib`);
}

console.log(`\nSUMMARY — DIFF: ${diffs.length}   NEW: ${newPubs.length}   (${APPLY ? "applied" : "report only"})`);
if (!APPLY && diffs.length + newPubs.length > 0) process.exit(2); // signal drift for CI
