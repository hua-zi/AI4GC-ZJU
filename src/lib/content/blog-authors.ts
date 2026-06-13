import { findTeamMemberById } from "@/lib/content/load-team";
import type { BlogAuthorRef } from "@/types/lab";

export function normalizeBlogAuthorIds(input: {
  authorId?: string;
  authorIds?: string[];
}): string[] {
  const ids: string[] = [];

  const single = input.authorId?.trim();
  if (single) {
    ids.push(single);
  }

  if (input.authorIds) {
    for (const value of input.authorIds) {
      const trimmed = value.trim();
      if (trimmed) {
        ids.push(trimmed);
      }
    }
  }

  const seen = new Set<string>();
  return ids.filter((id) => {
    const key = id.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function resolveBlogAuthorRefs(
  authorIds: string[],
  authorLabel?: string,
  postPath?: string,
): BlogAuthorRef[] {
  const refs: BlogAuthorRef[] = [];

  for (const authorId of authorIds) {
    const member = findTeamMemberById(authorId);
    if (!member) {
      throw new Error(
        `Unknown blog authorId "${authorId}"${postPath ? ` in ${postPath}` : ""}. ` +
          "Use a team member folder name from content/team/.",
      );
    }

    refs.push({
      id: member.id,
      name: member.name,
      profileHref: member.profile ? `/${member.profile}` : undefined,
    });
  }

  return refs;
}

export function resolveBlogAuthorLabel(
  authorLabel: string | undefined,
  authors: BlogAuthorRef[],
): string | undefined {
  const trimmed = authorLabel?.trim();
  if (trimmed) {
    return trimmed;
  }

  if (authors.length === 0) {
    return undefined;
  }

  return authors.map((author) => author.name).join(", ");
}
