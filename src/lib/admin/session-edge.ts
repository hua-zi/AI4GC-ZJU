import { getSessionTtlMs } from "@/lib/admin/config";

type SessionPayload = {
  exp: number;
};

async function signPayloadEdge(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return Buffer.from(signature).toString("base64url");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifySessionTokenEdge(
  token: string | undefined | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!token || !secret) {
    return false;
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return false;
  }

  const expected = await signPayloadEdge(payloadB64, secret);
  if (!timingSafeEqualStrings(signature, expected)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export { getSessionTtlMs };
