import { markdownExcerpt, parseMarkdown } from "@/lib/content/markdown";

export function blogExcerptFromBody(body: string, maxLength = 220): string {
  if (!body.trim()) {
    return "";
  }

  return markdownExcerpt(parseMarkdown(body), maxLength);
}
