import path from "path";
import { processBlogMarkdownBody } from "@/lib/content/markdown";
import { CONTENT_PATHS } from "@/lib/content/paths";
import { BLOG_INDEX_FILE } from "@/lib/content/constants";

export function blogAssetUrl(postFolder: string, assetPath: string): string {
  const normalized = assetPath.trim().replace(/^\.\//, "");
  const segments = normalized.split("/").filter(Boolean);
  return `/blog-assets/${postFolder}/${segments.map(encodeURIComponent).join("/")}`;
}

export function resolveBlogAsset(
  postFolder: string,
  value: string | null | undefined,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return blogAssetUrl(postFolder, trimmed);
}

export function rewriteBlogBodyAssets(body: string, postFolder: string): string {
  return processBlogMarkdownBody(body, postFolder).body;
}

export function blogPostDirPath(postFolder: string): string {
  return path.join(CONTENT_PATHS.blogDir, postFolder);
}

export function blogPostIndexPath(postFolder: string): string {
  return path.join(blogPostDirPath(postFolder), BLOG_INDEX_FILE);
}
