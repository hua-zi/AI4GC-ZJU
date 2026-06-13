import { readFileSync } from "fs";
import { parse } from "yaml";

export function readYamlFile<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf-8");
  return parse(raw) as T;
}
