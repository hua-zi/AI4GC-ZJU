import { type NextRequest } from "next/server";
import { setSessionCookie } from "@/lib/admin/auth";
import { getAdminPassword } from "@/lib/admin/config";
import { jsonError, jsonOk } from "@/lib/admin/api-helpers";
import { applyAdminSecurityHeaders, guardAdminSurface } from "@/lib/admin/request-guard";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/admin/rate-limit";

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const disabled = guardAdminSurface();
  if (disabled) {
    return disabled;
  }

  const key = clientKey(request);
  const rate = checkLoginRateLimit(key);
  if (!rate.allowed) {
    return applyAdminSecurityHeaders(
      jsonError("Too many login attempts. Try again later.", 429),
    );
  }

  const configuredPassword = getAdminPassword();
  if (!configuredPassword) {
    return jsonError("Admin password is not configured", 503);
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (body.password !== configuredPassword) {
    return jsonError("Invalid password", 401);
  }

  const ok = await setSessionCookie();
  if (!ok) {
    return jsonError("Admin secret is not configured", 503);
  }

  resetLoginRateLimit(key);
  return jsonOk({ ok: true });
}
