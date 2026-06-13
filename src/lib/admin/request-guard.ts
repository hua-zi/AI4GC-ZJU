import { NextResponse } from "next/server";
import { isAdminEnabled } from "@/lib/admin/config";

export function guardAdminSurface(): NextResponse | null {
  if (!isAdminEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  return null;
}

export function applyAdminSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
