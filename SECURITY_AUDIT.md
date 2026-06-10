# Security Audit — Group Therapy App

_Last reviewed: 2026-06-09_

## Summary

The app has a reasonable foundation (bcrypt, signed sessions, server-side auth guards, group-scoped queries) but relies heavily on application-level checks because the database has **no RLS policies** despite RLS being enabled — all queries use the Supabase service role key, which bypasses RLS entirely.

The most pressing risks are: **no rate limiting on login/PIN entry**, **session cookies that lack `secure` and have no payload-level expiry**, and **unvalidated image uploads**.

---

## ✅ Strengths

| Area | Notes |
|------|-------|
| Password hashing | bcrypt, cost factor 10 |
| Session signing | HMAC-SHA256 with `timingSafeEqual` (constant-time comparison) |
| Cookies | `httpOnly`, `sameSite: lax` |
| Service role isolation | Only used server-side; never exposed to the browser |
| Server action guards | All actions call `requireAdmin` / `requireUser` / `requireSession` |
| Group scoping | Queries filter by `group_id` consistently |
| `.gitignore` | `.env*` excluded — secrets aren't committed |
| No `dangerouslySetInnerHTML` | No obvious XSS sinks in the React tree |
| Personal task isolation | Admins cannot read or mutate personal tasks (fixed in latest commit) |
| Admin password reset codes | 24-hour expiry, single-use (`used_at` tracked) |
| Anonymous feedback | When `is_anonymous = true`, no `from_user_id` / `from_admin_id` is stored |

---

## 🔴 High Severity

### 1. RLS enabled, but no policies defined

Tables have `enable row level security` set in migration `0001_init.sql`, but **no `create policy` statements exist anywhere in the migrations**. Postgres default-denies on enabled RLS without policies, which means:

- Any query through the **anon** key fails silently.
- The app works only because it uses `createAdminClient()` — the service role key — which bypasses RLS.

**Risk:** No defense-in-depth. A single logic bug in any server action can read or write any group's data. If you ever add realtime subscriptions, public reads, or client-side reads, queries break silently.

**Fix:** Write RLS policies even if they're conservative. Example shape:

```sql
-- Allow service role to do anything (it already does, but make it explicit)
-- Allow authenticated users to read only their own group's data
create policy "users see own group tasks" on tasks
  for select using (group_id = (select group_id from users where id = auth.uid()));
```

Since you don't use Supabase Auth, you'd need a different approach — e.g., a Postgres function that reads a custom JWT claim, or simply keep RLS off and treat the service role as a trust boundary (but at least document that).

---

### 2. No rate limiting on login / PIN entry

`loginUserAction`, `loginAdminAction`, and `resetAdminPasswordWithCodeAction` accept attempts indefinitely with no throttling.

- A 4-digit PIN = **10,000 combinations** — brute-forceable in seconds at network speed.
- The admin reset code is 8 chars from a constrained alphabet — also brute-forceable without throttling.

**Risk:** Attacker who knows a group code + username can guess PINs unrestricted. Same for admin password reset codes.

**Fix:**

- Add rate limiting (e.g., `@upstash/ratelimit` + Redis, or a homegrown DB-backed counter).
- Suggested: 5 failed attempts per username per 15 minutes; 20 attempts per IP per 15 minutes.
- Consider lockout escalation after sustained failures.

---

### 3. Session cookie lacks `secure` flag

In `src/lib/session.ts`:

```ts
c.set(COOKIE_NAME, encodeSession(s), {
  httpOnly: true,
  sameSite: "lax",
  // No 'secure' flag — works over HTTP for local testing.
  path: "/",
  maxAge: 60 * 60 * 24 * 90,
});
```

**Risk:** In production over HTTPS, the cookie is still set without `secure`, meaning if the user ever lands on an HTTP URL (e.g., misconfigured redirect), the cookie is exposed.

**Fix:**

```ts
secure: process.env.NODE_ENV === "production",
```

---

### 4. Session has no payload-level expiration

The encoded session is `{ kind, userId, groupId, ... }` — there's no `exp` field. The HMAC signature alone is valid forever. `maxAge` is a browser-side hint only; a stolen cookie remains valid until you rotate `SESSION_SECRET`.

**Risk:** Stolen / leaked cookies grant indefinite access.

**Fix:** Add `exp: Date.now() + ninetyDays` to the payload and reject expired sessions in `decodeSession`. Optionally also include `iat` (issued at) for auditing.

---

## 🟡 Medium Severity

### 5. Image upload trusts user metadata

In `createTaskAction` / `editTaskAction`:

```ts
const ext = (image.name.split(".").pop() || "bin").toLowerCase();
const path = `${admin.groupId}/${crypto.randomUUID()}.${ext}`;
const buf = Buffer.from(await image.arrayBuffer());
await sb.storage.from(BUCKET).upload(path, buf, {
  contentType: image.type || "application/octet-stream",
  upsert: false,
});
```

Problems:

- **Extension** is taken from the filename — no allowlist.
- **Content-Type** is whatever the browser sends — trivially forged.
- **No file-size cap** — large uploads can DoS your Supabase storage quota.
- **No content validation** (magic-byte sniff).

**Risk:** Attacker uploads `.html` / `.svg` / `.js` with malicious content. If the bucket is public, it's served with attacker-controlled MIME, leading to XSS / phishing. Even if private, signed URLs render in iframes for some clients.

**Fix:**

```ts
const ALLOWED = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const ext = (image.name.split(".").pop() || "").toLowerCase();
if (!ALLOWED.has(ext)) throw new Error("Unsupported image type.");
if (image.size > 5 * 1024 * 1024) throw new Error("Image too large (max 5MB).");
// Optionally sniff magic bytes from the buffer.
```

Also verify in the Supabase dashboard that the `task-images` bucket is **private** and served only via signed URLs.

---

### 6. Admin password reset code can be brute-forced

The reset code is 8 characters from a non-ambiguous alphabet (~30 chars), giving ~6.5 × 10¹¹ combinations — strong enough in theory, but with no rate limiting on `resetAdminPasswordWithCodeAction` it's worth tightening.

**Fix:** Tie this into the rate limiter from §2. Also consider invalidating all of an admin's outstanding codes when one is consumed.

---

### 7. No audit log for sensitive admin actions

Actions like `rotateGroupCodeAction`, `rotateAdminInviteAction`, `removeUserAction`, `generateAdminResetCodeAction`, `adminResetMilestoneAction` have no audit trail.

**Risk:** If an admin account is compromised, you have no forensic record of what they touched.

**Fix:** Add an `audit_log` table:

```sql
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id),
  actor_kind text not null check (actor_kind in ('admin','user','system')),
  actor_id uuid,
  action text not null,
  target text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

Write one row per sensitive action.

---

### 8. Username regeneration / enumeration

`/join` lets a prospective user re-roll usernames against a group. With no rate limit, this could be used to enumerate existing members of a known group code.

**Risk:** Low (you need the group code first) but still an information leak.

**Fix:** Same rate limiter; cap regenerations per IP per minute.

---

## 🟢 Low Severity / Hardening Suggestions

### 9. No security headers

No CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy. Add in `next.config.ts` via `headers()`:

```ts
{
  source: "/(.*)",
  headers: [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    // CSP requires more care; start with report-only.
  ],
}
```

### 10. PIN minimum is 4 with no strength check

Users can pick `0000`, `1234`. Consider:

- Minimum 6 digits.
- Reject obvious patterns (`123456`, `000000`, `111111`).

### 11. Debug `console.log` in production code

`editTaskAction` logs filenames and buffer sizes — not super sensitive but noisy and unnecessary in prod. Strip them.

### 12. CSRF

Next.js 15+ does Origin checking on Server Actions automatically, which mitigates most CSRF. No explicit token needed, but be aware: if you ever expose a JSON API, you'd need to add explicit CSRF protection.

### 13. Verify `task-images` bucket privacy

Check the Supabase Storage dashboard — the bucket should be **private** (not "public"). If public, anyone with the URL can fetch any task image.

### 14. Service role key is a single point of failure

Rotate `SUPABASE_SERVICE_ROLE_KEY` periodically and treat it like a master password. Vercel project secrets only; never commit.

### 15. Reading-plan and feedback actions lack consistent ownership re-checks

Most action handlers verify `group_id`, but spot-check each one — for example, ensure that when a user marks a reading plan day done, the action confirms the allocation belongs to that user, not just to the same group.

---

## 🔧 Recommended Priority Order

1. **Add `secure` flag** to session cookies in production (1-line fix).
2. **Add session `exp` field** + validation (10 lines).
3. **Add rate limiting** to all login / PIN / reset endpoints.
4. **Validate image uploads** (extension allowlist + size cap).
5. **Confirm `task-images` bucket is private**.
6. **Add security headers** in `next.config.ts`.
7. **Write audit_log** for admin actions.
8. **Decide on RLS strategy** — either write policies or document explicitly that service role is the trust boundary.
9. **Strip debug `console.log`s** before shipping.
10. **Strengthen PIN minimums**.

---

## Out of Scope

- **Penetration testing** — this audit is code-review based. A live pen test would surface additional issues (timing attacks, DoS thresholds, etc.).
- **Supabase dashboard config** — bucket policies, network rules, and SQL roles need to be verified inside Supabase.
- **Deployment platform** — Vercel-side config (env vars, custom domains, headers via dashboard) wasn't reviewed.
