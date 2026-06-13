import { existsSync } from "fs";
import { CONTENT_PATHS } from "@/lib/content/paths";
import { readYamlFile } from "@/lib/content/read-yaml";
import { siteConfigSchema } from "@/lib/content/schema";
import type { SiteConfig } from "@/types/lab";

export function loadSiteConfig(): SiteConfig {
  const raw = existsSync(CONTENT_PATHS.site)
    ? readYamlFile<Record<string, unknown>>(CONTENT_PATHS.site)
    : {};

  return siteConfigSchema.parse(raw);
}
