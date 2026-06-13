import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import path from "path";
import matter from "gray-matter";
import { parse, stringify } from "yaml";
import { CONTENT_DIR } from "@/lib/content/paths";

const PUBLIC_DIR = path.join(process.cwd(), "public");

export const ALLOWED_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

function assertSafeSegment(segment: string): void {
  if (!segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\")) {
    throw new Error(`Invalid path segment: ${segment}`);
  }
}

function resolveUnderRoot(root: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new Error("Path traversal is not allowed");
  }

  const resolved = path.resolve(root, normalized);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error("Path traversal is not allowed");
  }

  return resolved;
}

export function resolveContentPath(relativePath: string): string {
  return resolveUnderRoot(CONTENT_DIR, relativePath);
}

export function resolvePublicPath(relativePath: string): string {
  return resolveUnderRoot(PUBLIC_DIR, relativePath);
}

function ensureParentDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function atomicWrite(filePath: string, data: Buffer | string): void {
  ensureParentDir(filePath);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, data);
  renameSync(tempPath, filePath);
}

export function readText(relativePath: string): string {
  const filePath = resolveContentPath(relativePath);
  return readFileSync(filePath, "utf-8");
}

export function writeText(relativePath: string, content: string): void {
  const filePath = resolveContentPath(relativePath);
  atomicWrite(filePath, content);
}

export function readYaml<T>(relativePath: string): T {
  return parse(readText(relativePath)) as T;
}

export function writeYaml(relativePath: string, data: unknown): void {
  writeText(relativePath, `${stringify(data)}\n`);
}

export function writeMarkdown(
  relativePath: string,
  frontmatter: Record<string, unknown>,
  body: string,
): void {
  const content = matter.stringify(body.trimEnd() ? `${body.trimEnd()}\n` : "", frontmatter);
  writeText(relativePath, content);
}

export function deleteFile(relativePath: string): void {
  const filePath = resolveContentPath(relativePath);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export function deleteDir(relativePath: string): void {
  const dirPath = resolveContentPath(relativePath);
  if (existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true, force: true });
  }
}

export function writeBinaryPublic(relativePath: string, data: Buffer): void {
  const filePath = resolvePublicPath(relativePath);
  atomicWrite(filePath, data);
}

export function writeBinaryContent(relativePath: string, data: Buffer): void {
  const filePath = resolveContentPath(relativePath);
  atomicWrite(filePath, data);
}

export function safeFilename(name: string): string {
  const base = path.basename(name);
  assertSafeSegment(base);
  return base;
}

export { assertSafeSegment, PUBLIC_DIR, CONTENT_DIR };
