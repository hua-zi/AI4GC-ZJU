export const SESSION_COOKIE = "admin_session";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function getSessionTtlMs(): number {
  return SESSION_TTL_MS;
}

export function isAdminEnabled(): boolean {
  const flag = process.env.ADMIN_ENABLED?.trim().toLowerCase();
  if (flag === "true" || flag === "1") {
    return true;
  }
  if (flag === "false" || flag === "0") {
    return false;
  }
  // Dev: enabled by default so /admin works with only ADMIN_PASSWORD in .env.local
  return process.env.NODE_ENV !== "production";
}

export function getAdminPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value || undefined;
}

export function getAdminSecret(): string | undefined {
  const value = process.env.ADMIN_SECRET?.trim();
  if (value) {
    return value;
  }
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }
  return getAdminPassword();
}

export function getAdminAllowedIps(): string[] {
  const raw = process.env.ADMIN_ALLOWED_IPS?.trim();
  if (!raw) {
    return [];
  }

  return raw.split(",").map((ip) => ip.trim()).filter(Boolean);
}
