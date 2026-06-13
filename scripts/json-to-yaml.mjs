import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { stringify } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, "..", "content");

const files = ["news", "publications", "team", "home", "songhan"];

for (const name of files) {
  const jsonPath = path.join(contentDir, `${name}.json`);
  const yamlPath = path.join(contentDir, `${name}.yaml`);

  if (!existsSync(jsonPath)) {
    console.warn(`Skip ${name}: no JSON file`);
    continue;
  }

  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const yaml = stringify(data, { lineWidth: 100, defaultKeyType: "PLAIN" });
  writeFileSync(yamlPath, `# ${name}.yaml — edit and commit; site rebuilds on deploy.\n\n${yaml}`, "utf-8");
  unlinkSync(jsonPath);
  console.log(`Wrote content/${name}.yaml`);
}

console.log("Done.");
