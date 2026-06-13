import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { applyAdminSecurityHeaders, guardAdminSurface } from "@/lib/admin/request-guard";

export async function requireAdminJson(): Promise<NextResponse | null> {
  const disabled = guardAdminSurface();
  if (disabled) {
    return disabled;
  }

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return jsonError("Unauthorized", 401);
  }

  return null;
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return applyAdminSecurityHeaders(NextResponse.json(data, { status }));
}

export function jsonError(message: string, status = 400): NextResponse {
  return applyAdminSecurityHeaders(NextResponse.json({ error: message }, { status }));
}
