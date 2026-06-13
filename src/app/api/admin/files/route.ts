import { unlinkSync } from "fs";
import { type NextRequest } from "next/server";
import {
  CONTENT_SECTIONS,
  assertEditableContentFile,
  createContentDirectory,
  getContentRootRelativePath,
  listContentEntries,
  readContentFile,
  writeContentFile,
} from "@/lib/admin/file-console";
import { jsonError, jsonOk, requireAdminJson } from "@/lib/admin/api-helpers";
import { resolveContentPath } from "@/lib/admin/content-store";
import { revalidateHome, revalidatePublications, revalidateSite } from "@/lib/admin/revalidate";

function revalidateForFile(relativePath: string) {
  if (relativePath === "site.yaml") {
    revalidateSite();
    return;
  }
  if (relativePath === "publications.bib") {
    revalidatePublications();
    return;
  }
  if (relativePath.startsWith("home/") || relativePath === "home.yaml") {
    revalidateHome();
    return;
  }

  revalidateSite();
}

export async function GET(request: NextRequest) {
  const denied = await requireAdminJson();
  if (denied) {
    return denied;
  }

  const filePath = request.nextUrl.searchParams.get("path");
  if (!filePath) {
    return jsonOk({
      root: getContentRootRelativePath(),
      sections: CONTENT_SECTIONS,
      entries: listContentEntries(),
    });
  }

  try {
    const normalized = assertEditableContentFile(filePath);
    return jsonOk({
      path: normalized,
      content: readContentFile(normalized),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to read file", 400);
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdminJson();
  if (denied) {
    return denied;
  }

  const body = (await request.json().catch(() => null)) as {
    path?: unknown;
    content?: unknown;
  } | null;

  if (!body || typeof body.path !== "string" || typeof body.content !== "string") {
    return jsonError("Expected path and content.", 400);
  }

  try {
    const normalized = assertEditableContentFile(body.path);
    writeContentFile(normalized, body.content);
    revalidateForFile(normalized);
    return jsonOk({ path: normalized });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to write file", 400);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminJson();
  if (denied) {
    return denied;
  }

  const body = (await request.json().catch(() => null)) as {
    path?: unknown;
    kind?: unknown;
  } | null;

  if (!body || typeof body.path !== "string" || typeof body.kind !== "string") {
    return jsonError("Expected path and kind.", 400);
  }

  try {
    if (body.kind === "directory") {
      createContentDirectory(body.path);
      revalidateSite();
      return jsonOk({ path: body.path });
    }

    return jsonError("kind must be directory.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create folder", 400);
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdminJson();
  if (denied) {
    return denied;
  }

  const filePath = request.nextUrl.searchParams.get("path");
  if (!filePath) {
    return jsonError("Missing path query parameter.", 400);
  }

  try {
    const normalized = assertEditableContentFile(filePath);
    unlinkSync(resolveContentPath(normalized));
    revalidateForFile(normalized);
    return jsonOk({ path: normalized });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete file", 400);
  }
}
