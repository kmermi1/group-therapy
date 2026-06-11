import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Returns the Redis instance if credentials are configured AND valid,
// otherwise null. We fail OPEN: app keeps working, rate limiting is disabled,
// a warning is logged in production.
let warned = false;
function warnOnce(msg: string) {
  if (warned || process.env.NODE_ENV !== "production") return;
  // eslint-disable-next-line no-console
  console.warn(msg);
  warned = true;
}

// Defensive cleanup for values pasted with surrounding quotes (a common
// Vercel env-var mistake when copying from .env files).
function cleanEnv(v: string | undefined): string | undefined {
  if (!v) return v;
  let s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function getRedis(): Redis | null {
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url || !token) {
    warnOnce("[ratelimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiting is disabled.");
    return null;
  }
  // Validate URL format before constructing so a bad value doesn't crash the
  // module at import time (which would break `next build`).
  if (!url.startsWith("https://")) {
    warnOnce(`[ratelimit] UPSTASH_REDIS_REST_URL is not an https URL — rate limiting disabled. Got: ${url.slice(0, 20)}...`);
    return null;
  }
  try {
    return new Redis({ url, token });
  } catch (e) {
    warnOnce(`[ratelimit] Failed to construct Upstash client — rate limiting disabled. ${(e as Error).message}`);
    return null;
  }
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

// Custom error so callers can tell "rate limit hit" apart from any other
// error (including Upstash network failures).
export class RateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

// Checks one or more limiters. Throws RateLimitExceededError if any are
// exceeded. Returns nothing on success. Fail-open when limiter is null
// (no Redis configured) OR when the network call to Upstash fails — we
// don't want a Redis outage to make logins impossible.
export async function checkRateLimit(
  limiters: Array<{ rl: Ratelimit | null; key: string; label: string } | null>
): Promise<void> {
  for (const entry of limiters) {
    if (!entry) continue;
    const { rl, key, label } = entry;
    if (!rl) continue;
    let result;
    try {
      result = await rl.limit(key);
    } catch (e) {
      // Network / Upstash failure: fail open so users can still log in.
      // eslint-disable-next-line no-console
      console.warn(`[ratelimit] Upstash call failed; allowing request. ${(e as Error).message}`);
      continue;
    }
    const { success, reset } = result;
    if (!success) {
      const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      const minutes = Math.ceil(seconds / 60);
      const wait = seconds < 60 ? `${seconds}s` : `${minutes}m`;
      throw new RateLimitExceededError(
        `Too many attempts (${label}). Please wait ${wait} and try again.`
      );
    }
  }
}
