import type { MemberLink } from "@/types/lab";

export function normalizeMemberEmail(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  const address = trimmed.toLowerCase().startsWith("mailto:")
    ? trimmed.slice("mailto:".length).trim()
    : trimmed;

  return address || undefined;
}

/** Pull mailto links out of `links` so email gets its own UI. */
export function resolveMemberEmail(
  explicitEmail: string | undefined,
  links: MemberLink[],
): { email?: string; links: MemberLink[] } {
  let email = normalizeMemberEmail(explicitEmail);
  const filtered: MemberLink[] = [];

  for (const link of links) {
    const href = link.href.trim();
    if (href.toLowerCase().startsWith("mailto:")) {
      if (!email) {
        email = normalizeMemberEmail(href);
      }
      continue;
    }
    filtered.push(link);
  }

  return { email, links: filtered };
}

export function isMailtoLink(href: string): boolean {
  return href.trim().toLowerCase().startsWith("mailto:");
}
