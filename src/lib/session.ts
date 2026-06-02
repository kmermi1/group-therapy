import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// Tiny signed-cookie session. We don't use Supabase Auth because we don't
// want emails on file; instead we sign a JSON payload with a server secret.

export type Session =
  | { kind: "user"; userId: string; groupId: string; username: string }
  | { kind: "admin"; adminId: string; groupId: string; username: string };

const COOKIE_NAME = "gt_session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(s: Session): string {
  const json = JSON.stringify(s);
  const payload = Buffer.from(json).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  return decodeSession(c.get(COOKIE_NAME)?.value);
}

export async function setSession(s: Session) {
  const c = await cookies();
  c.set(COOKIE_NAME, encodeSession(s), {
    httpOnly: true,
    sameSite: "lax",
    // No 'secure' flag — works over HTTP for local testing. Over HTTPS
    // (Vercel) browsers still treat it appropriately.
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
