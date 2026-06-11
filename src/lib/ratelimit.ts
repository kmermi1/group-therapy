import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Returns the Redis instance if credentials are configured, otherwise null.
// We fail OPEN when Upstash isn't configured: the app continues to work,
// but rate limiting is disabled. A warning is logged in production.
let warned = false;
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned && process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiting is disabled. This is a security risk in production."
      );
      warned = true;
    }
    return null;
  }
  return new Redis({ url, token });
}

const redis = getRedis();

// Sliding window limiters. Tune as needed.
//
// loginByUser: per (kind, username, groupCode) — protects against guessing a
//   specific user's PIN/password. Strict.
// loginByIp: per IP — caps total damage one attacker can do across users.
// resetByIp: per IP — protects admin password reset code from brute force.
// regenByIp: per IP — username regeneration / enumeration during join.
export const loginByUser = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: false,
      prefix: "rl:login:user",
    })
  : null;

export const loginByIp = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "15 m"),
      analytics: false,
      prefix: "rl:login:ip",
    })
  : null;

export const resetByIp = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      analytics: false,
      prefix: "rl:reset:ip",
    })
  : null;

export const regenByIp = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: false,
      prefix: "rl:regen:ip",
    })
  : null;

// Reads the client IP from forwarded headers. Vercel sets x-forwarded-for.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// Checks one or more limiters. Throws a friendly error if any are exceeded.
// Returns nothing on success. Fail-open when limiter is null (no Redis).
export async function checkRateLimit(
  limiters: Array<{ rl: Ratelimit | null; key: string; label: string } | null>
): Promise<void> {
  for (const entry of limiters) {
    if (!entry) continue;
    const { rl, key, label } = entry;
    if (!rl) continue;
    const { success, reset } = await rl.limit(key);
    if (!success) {
      const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      const minutes = Math.ceil(seconds / 60);
      const wait = seconds < 60 ? `${seconds}s` : `${minutes}m`;
      throw new Error(
        `Too many attempts (${label}). Please wait ${wait} and try again.`
      );
    }
  }
}
