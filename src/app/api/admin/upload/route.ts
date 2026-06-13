import { mkdirSync } from "fs";
import path from "path";
import { type NextRequest } from "next/server";
import {
  ALLOWED_UPLOAD_MIMES,
  resolveContentPath,
  safeFilename,
  writeBinaryContent,
} from "@/lib/admin/content-store";
import { jsonError, jsonOk, requireAdminJson } from "@/lib/admin/api-helpers";
import { TEAM_CONTENT_GROUPS } from "@/lib/content/paths";

function isTeamAssetDest(dest: string): boolean {
  const normalized = dest.replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "team") {
    return false;
  }

  const group = parts[1];
  return (TEAM_CONTENT_GROUPS as readonly string[]).includes(group);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminJson();
  if (denied) {
    return denied;
  }

  const dest = request.nextUrl.searchParams.get("dest")?.trim();
  if (!dest) {
    return jsonError("Missing dest query parameter", 400);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Expected multipart form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("Missing file field", 400);
  }

  if (!ALLOWED_UPLOAD_MIMES.has(file.type)) {
    return jsonError(`Unsupported file type: ${file.type}`, 400);
  }

  const filename = safeFilename(file.name || "upload.bin");
  const buffer = Buffer.from(await file.arrayBuffer());

  const normalizedDest = dest.replace(/^\/+/, "");

  if (normalizedDest === "assets" || normalizedDest.startsWith("assets/")) {
    const relative = normalizedDest === "assets" ? filename : `${normalizedDest.slice("assets/".length)}/${filename}`;
    const assetPath = `assets/${relative}`;
    resolveContentPath(assetPath);
    writeBinaryContent(assetPath, buffer);
    return jsonOk({ path: `/content-assets/${relative.replace(/\\/g, "/")}` });
  }

  if (isTeamAssetDest(normalizedDest) || normalizedDest.startsWith("team-assets/")) {
    const teamPath = normalizedDest.startsWith("team-assets/")
      ? `team/${normalizedDest.slice("team-assets/".length)}`
      : normalizedDest;
    const absolute = resolveContentPath(`${teamPath}/${filename}`);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeBinaryContent(`${teamPath}/${filename}`, buffer);
    return jsonOk({ path: `/team-assets/${teamPath.slice("team/".length)}/${filename}` });
  }

  if (normalizedDest.startsWith("blog/")) {
    const relative = `${normalizedDest}/${filename}`;
    resolveContentPath(relative);
    writeBinaryContent(relative, buffer);
    const slug = normalizedDest.split("/")[1];
    return jsonOk({ path: `/blog-assets/${slug}/${filename}` });
  }

  if (normalizedDest.startsWith("home/modules/")) {
    const relative = `${normalizedDest}/${filename}`;
    resolveContentPath(relative);
    writeBinaryContent(relative, buffer);
    const moduleId = normalizedDest.split("/")[2];
    return jsonOk({ path: `/home-assets/${moduleId}/${filename}` });
  }

  return jsonError("dest must be assets, home/modules/{module}, team/{group}/{folder}, or blog/{slug}", 400);
}
