import { existsSync, readdirSync, readFileSync } from "fs";
import {
  normalizeBlogAuthorIds,
  resolveBlogAuthorLabel,
  resolveBlogAuthorRefs,
} from "@/lib/content/blog-authors";
import { parseNewsDateKey } from "@/lib/content/date";
import matter from "gray-matter";
import { CONTENT_PATHS } from "@/lib/content/paths";
import { blogPostIndexPath, resolveBlogAsset } from "@/lib/content/blog-assets";
import { processBlogMarkdownBody } from "@/lib/content/markdown";
import { blogPostSchema, blogPostFrontmatterSchema } from "@/lib/content/schema";
import { resolveId } from "@/lib/content/slug";
import type { BlogPost } from "@/types/lab";

function listBlogPostFolders(): string[] {
  const dir = CONTENT_PATHS.blogDir;
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((folder) => existsSync(blogPostIndexPath(folder)))
    .sort();
}

function sortBlogPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => parseNewsDateKey(b.date) - parseNewsDateKey(a.date));
}

function loadBlogPostFile(postFolder: string): BlogPost | null {
  const filePath = blogPostIndexPath(postFolder);
  const { data, content } = matter(readFileSync(filePath, "utf-8"));
  const parsed = blogPostFrontmatterSchema.parse(data);

  if (parsed.draft) {
    return null;
  }

  const id = resolveId(parsed.id, postFolder);
  const markdown = processBlogMarkdownBody(content.trim(), postFolder);
  const body = markdown.body;
  const desc = parsed.desc?.trim() || markdown.excerpt;
  const cover = resolveBlogAsset(postFolder, parsed.cover);
  const pathLabel = `content/blog/${postFolder}/`;
  const authorIds = normalizeBlogAuthorIds(parsed);
  const authors = resolveBlogAuthorRefs(authorIds, parsed.author, pathLabel);
  const author = resolveBlogAuthorLabel(parsed.author, authors);

  return blogPostSchema.parse({
    id,
    title: parsed.title,
    date: parsed.date,
    desc,
    author,
    authors,
    tags: parsed.tags,
    cover,
    coverAlt: parsed.coverAlt,
    body,
  });
}

function loadAllBlogPosts(): BlogPost[] {
  const folders = listBlogPostFolders();
  const seen = new Map<string, string>();

  const posts = folders.map((folder) => {
    const post = loadBlogPostFile(folder);
    if (!post) {
      return null;
    }

    const key = post.id.toLowerCase();
    const pathLabel = `content/blog/${folder}/`;
    const existing = seen.get(key);
    if (existing) {
      throw new Error(`Duplicate blog id "${post.id}" at ${existing} and ${pathLabel}`);
    }
    seen.set(key, pathLabel);

    return post;
  }).filter((post): post is BlogPost => post !== null);

  return sortBlogPosts(posts);
}

export function loadBlogPosts(): BlogPost[] {
  return loadAllBlogPosts();
}

export function loadBlogPost(slug: string): BlogPost | null {
  const normalized = slug.replace(/^\//, "").toLowerCase();
  return loadAllBlogPosts().find((post) => post.id.toLowerCase() === normalized) ?? null;
}

export function listBlogPostSlugs(): string[] {
  return loadAllBlogPosts().map((post) => post.id);
}

export function loadBlogPostsByAuthorId(memberId: string): BlogPost[] {
  const normalized = memberId.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return loadAllBlogPosts().filter((post) =>
    post.authors.some((author) => author.id.toLowerCase() === normalized),
  );
}
