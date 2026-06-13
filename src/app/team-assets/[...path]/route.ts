import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { CONTENT_PATHS } from "@/lib/content/paths";
import { isTeamContentGroup } from "@/lib/content/team-assets";

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
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const segments = (await params).path;
  if (segments.length < 3) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [group, member, ...fileParts] = segments;
  if (!isTeamContentGroup(group) || fileParts.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileName = fileParts.join("/");
  if (fileName.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const memberDir = path.join(CONTENT_PATHS.teamDir, group, member);
  const filePath = path.join(memberDir, fileName);
  const resolved = path.resolve(filePath);
  const resolvedMemberDir = path.resolve(memberDir);

  if (!resolved.startsWith(resolvedMemberDir)) {
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
