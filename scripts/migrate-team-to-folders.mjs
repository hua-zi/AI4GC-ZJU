import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const TEAM_DIR = path.join(ROOT, "content", "team");
const PUBLIC_DIR = path.join(ROOT, "public");
const GROUPS = ["pi", "postdocs", "phds", "masters", "undergrads", "alumni"];
const MEMBER_MD = /\.md$/i;

function photoFileName(sourcePath) {
  const ext = path.extname(sourcePath) || ".jpg";
  return `photo${ext}`;
}

function migratePhoto(memberDir, photoValue) {
  if (!photoValue || photoValue === "null") {
    return photoValue;
  }

  const trimmed = String(photoValue).trim();
  if (!trimmed || trimmed.startsWith("http")) {
    return trimmed;
  }

  let sourcePath = null;
  if (trimmed.startsWith("/")) {
    sourcePath = path.join(PUBLIC_DIR, trimmed);
  } else if (!trimmed.startsWith("./")) {
    sourcePath = path.join(memberDir, trimmed);
    if (!existsSync(sourcePath)) {
      return trimmed;
    }
    return trimmed;
  }

  if (sourcePath && existsSync(sourcePath)) {
    const destName = photoFileName(sourcePath);
    copyFileSync(sourcePath, path.join(memberDir, destName));
    return destName;
  }

  return trimmed;
}

for (const group of GROUPS) {
  const dir = path.join(TEAM_DIR, group);
  if (!existsSync(dir)) continue;

  for (const file of readdirSync(dir).filter((name) => MEMBER_MD.test(name))) {
    const slug = file.replace(/\.md$/i, "");
    const sourcePath = path.join(dir, file);
    const memberDir = path.join(dir, slug);
    const destPath = path.join(memberDir, "index.md");

    mkdirSync(memberDir, { recursive: true });

    const raw = readFileSync(sourcePath, "utf-8");
    const { data, content } = matter(raw);
    const nextData = { ...data };

    if (nextData.photo !== undefined) {
      nextData.photo = migratePhoto(memberDir, nextData.photo);
    }

    writeFileSync(destPath, matter.stringify(content, nextData), "utf-8");
    unlinkSync(sourcePath);
    console.log(`Moved ${sourcePath} -> ${destPath}`);
  }
}

console.log("Team member folder migration complete.");
