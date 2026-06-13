import path from "path";
import { CONTENT_PATHS, TEAM_CONTENT_GROUPS, type TeamContentGroup } from "@/lib/content/paths";

export type { TeamContentGroup } from "@/lib/content/paths";

export function isTeamContentGroup(value: string): value is TeamContentGroup {
  return (TEAM_CONTENT_GROUPS as readonly string[]).includes(value);
}

export function memberAssetUrl(
  group: TeamContentGroup,
  memberFolder: string,
  assetPath: string,
): string {
  const normalized = assetPath.trim().replace(/^\.\//, "");
  const segments = normalized.split("/").filter(Boolean);
  return `/team-assets/${group}/${memberFolder}/${segments.map(encodeURIComponent).join("/")}`;
}

export function resolveMemberAsset(
  group: TeamContentGroup,
  memberFolder: string,
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return memberAssetUrl(group, memberFolder, trimmed);
}

export function rewriteMemberBodyAssets(
  body: string,
  group: TeamContentGroup,
  memberFolder: string,
): string {
  if (!body.trim()) {
    return body;
  }

  return body.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (match, prefix, href, suffix) => {
    const target = href.trim();
    if (
      !target
      || /^https?:\/\//i.test(target)
      || target.startsWith("/")
      || target.startsWith("#")
      || target.startsWith("mailto:")
    ) {
      return match;
    }

    return `${prefix}${memberAssetUrl(group, memberFolder, target)}${suffix}`;
  });
}

export function memberDirPath(group: TeamContentGroup, memberFolder: string): string {
  return path.join(CONTENT_PATHS.teamDir, group, memberFolder);
}

export function memberIndexPath(group: TeamContentGroup, memberFolder: string): string {
  return path.join(memberDirPath(group, memberFolder), "index.md");
}
