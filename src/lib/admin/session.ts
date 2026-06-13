import { createHmac, timingSafeEqual } from "crypto";
import { getAdminSecret, getSessionTtlMs } from "@/lib/admin/config";

type SessionPayload = {
  exp: number;
};

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createSessionToken(): string | null {
  const secret = getAdminSecret();
  if (!secret) {
    return null;
  }

  const payload: SessionPayload = {
    exp: Date.now() + getSessionTtlMs(),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) {
    return false;
  }

  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return false;
  }

  const expected = signPayload(payloadB64, secret);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
