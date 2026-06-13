import { existsSync } from "fs";
import { CONTENT_PATHS } from "@/lib/content/paths";
import {
  loadPublicationsFromBibFile,
  sortPublicationsByYear,
} from "@/lib/content/bib-publications";
import type { PublicationItem } from "@/types/lab";

export function loadPublications(): PublicationItem[] {
  const bibPath = CONTENT_PATHS.publicationsBib;
  if (!existsSync(bibPath)) {
    return [];
  }

  return sortPublicationsByYear(loadPublicationsFromBibFile(bibPath));
}
