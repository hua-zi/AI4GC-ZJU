import { toString } from "mdast-util-to-string";
import type { Root } from "mdast";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { blogAssetUrl } from "@/lib/content/blog-assets";

export const markdownRemarkPlugins = [remarkGfm, remarkMath] as const;

const markdownProcessor = remark().use(remarkGfm).use(remarkMath);

export type ProcessedBlogMarkdown = {
  body: string;
  excerpt: string;
};

function shouldRewriteAssetUrl(url: string): boolean {
  const target = url.trim();
  return Boolean(
    target
      && !/^https?:\/\//i.test(target)
      && !target.startsWith("/")
      && !target.startsWith("#")
      && !target.startsWith("mailto:"),
  );
}

export function parseMarkdown(body: string): Root {
  return markdownProcessor.parse(body) as Root;
}

export function stringifyMarkdown(tree: Root): string {
  return markdownProcessor.stringify(tree).trimEnd();
}

export function rewriteMarkdownAssetUrls(tree: Root, postFolder: string): void {
  visit(tree, (node) => {
    if (node.type !== "link" && node.type !== "image") {
      return;
    }

    if (typeof node.url === "string" && shouldRewriteAssetUrl(node.url)) {
      node.url = blogAssetUrl(postFolder, node.url);
    }
  });
}

export function markdownExcerpt(tree: Root, maxLength = 220): string {
  const chunks: string[] = [];

  for (const child of tree.children) {
    if (child.type === "heading" || child.type === "code" || child.type === "thematicBreak" || child.type === "math") {
      continue;
    }

    const text = toString(child).replace(/\s+/g, " ").trim();
    if (text) {
      chunks.push(text);
    }
  }

  const plain = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (!plain) {
    return "";
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

/** Parse blog Markdown once: rewrite local asset URLs and build a plain-text excerpt. */
export function processBlogMarkdownBody(body: string, postFolder: string): ProcessedBlogMarkdown {
  if (!body.trim()) {
    return { body, excerpt: "" };
  }

  const tree = parseMarkdown(body);
  rewriteMarkdownAssetUrls(tree, postFolder);

  return {
    body: stringifyMarkdown(tree),
    excerpt: markdownExcerpt(tree),
  };
}
