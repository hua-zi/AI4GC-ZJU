import { clearSessionCookie } from "@/lib/admin/auth";
import { jsonOk, requireAdminJson } from "@/lib/admin/api-helpers";

export async function POST() {
  const denied = await requireAdminJson();
  if (denied) {
    return denied;
  }

  await clearSessionCookie();
  return jsonOk({ ok: true });
}
