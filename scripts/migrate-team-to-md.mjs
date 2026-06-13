import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import matter from "gray-matter";
import { load as loadYaml } from "js-yaml";

const ROOT = process.cwd();
const TEAM_DIR = path.join(ROOT, "content", "team");
const PAGES_DIR = path.join(ROOT, "content", "pages");
const GROUPS = ["pi", "postdocs", "phds", "masters", "undergrads", "alumni"];
const MEMBER_PATTERN = /\.ya?ml$/i;

const songhanPagePath = path.join(PAGES_DIR, "songhan.md");
const songhanPage = existsSync(songhanPagePath)
  ? matter(readFileSync(songhanPagePath, "utf-8"))
  : null;

for (const group of GROUPS) {
  const dir = path.join(TEAM_DIR, group);
  if (!existsSync(dir)) continue;

  for (const file of readdirSync(dir).filter((name) => MEMBER_PATTERN.test(name))) {
    const yamlPath = path.join(dir, file);
    const mdPath = yamlPath.replace(/\.ya?ml$/i, ".md");
    const raw = loadYaml(readFileSync(yamlPath, "utf-8"));

    if (!raw || typeof raw !== "object") {
      throw new Error(`Invalid YAML in ${yamlPath}`);
    }

    const data = { ...raw };

    let body = "";
    if (group === "pi" && file.replace(/\.ya?ml$/i, "") === "song-han" && songhanPage) {
      Object.assign(data, songhanPage.data);
      body = songhanPage.content.trim();
    }

    writeFileSync(mdPath, matter.stringify(body, data), "utf-8");
    unlinkSync(yamlPath);
    console.log(`Migrated ${yamlPath} -> ${mdPath}`);
  }
}

if (existsSync(songhanPagePath)) {
  unlinkSync(songhanPagePath);
  console.log(`Removed ${songhanPagePath}`);
}

console.log("Team YAML -> MD migration complete.");
