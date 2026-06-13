import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { CONTENT_PATHS } from "@/lib/content/paths";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

type RouteParams = {
  params: Promise<{ module: string; path: string[] }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { module, path: fileParts } = await params;
  if (!module || fileParts.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileName = fileParts.join("/");
  if (module.includes("..") || fileName.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const moduleDir = path.join(CONTENT_PATHS.homeModulesDir, module);
  const filePath = path.join(moduleDir, fileName);
  const resolved = path.resolve(filePath);
  const resolvedModuleDir = path.resolve(moduleDir);

  if (!resolved.startsWith(resolvedModuleDir)) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!existsSync(resolved)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = readFileSync(resolved);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}
