# Security Audit — Group Therapy App

_Initial audit: 2026-06-09_
_Last updated: 2026-06-11_

## Status legend

- ✅ **Fixed** — implemented and verified
- 🚧 **In progress** — partially addressed
- ⏸ **Deferred** — intentionally postponed; reason documented
- 📋 **Open** — not yet addressed

---

## Summary

The app has a reasonable foundation (bcrypt, signed sessions, server-side auth guards, group-scoped queries) but relies heavily on application-level checks because the database has **no RLS policies** despite RLS being enabled — all queries use the Supabase service role key, which bypasses RLS entirely.

The most pressing remaining risks are: **no rate limiting on login/PIN entry**, **session cookies have no payload-level expiry**, and **no RLS-based defense-in-depth**.

---

## ✅ Strengths

| Area | Notes |
|------|-------|
| Password hashing | bcrypt, cost factor 10 |
| Session signing | HMAC-SHA256 with `timingSafeEqual` (constant-time comparison) |
| Cookies | `httpOnly`, `sameSite: lax`, `secure` in production ✅ |
| Service role isolation | Only used server-side; never exposed to the browser |
| Server action guards | All actions call `requireAdmin` / `requireUser` / `requireSession` |
| Group scoping | Queries filter by `group_id` consistently |
| `.gitignore` | `.env*` excluded — secrets aren't committed |
| No `dangerouslySetInnerHTML` | No obvious XSS sinks in the React tree |
| Personal task isolation | Admins cannot read or mutate personal tasks |
| Admin password reset codes | 24-hour expiry, single-use (`used_at` tracked) |
| Anonymous feedback | When `is_anonymous = true`, no `from_user_id` / `from_admin_id` is stored |
| Image upload validation | Extension allowlist + 5MB cap on all task actions ✅ |
| Security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy ✅ |

---

## 🔴 High Severity

### 1. RLS enabled, but no policies defined — ⏸ Deferred

Tables have `enable row level security` set in migration `0001_init.sql`, but **no `create policy` statements exist anywhere in the migrations**. The app works only because it uses `createAdminClient()` — the service role key — which bypasses RLS.

**Risk:** No defense-in-depth. A single logic bug in any server action can read or write any group's data.

**Decision (deferred):** Implementing RLS requires either rewriting the app to use Supabase Auth, or building a custom JWT-with-claims mechanism. The app's threat model and current architecture rely on the service role as the trust boundary. **Service role is the trust boundary — treat all server actions accordingly.** Revisit if:

- We introduce realtime subscriptions or any client-direct DB reads
- We have time for the architectural lift
- The app's data sensitivity increases

**To revisit:** Write at least deny-all policies for the anon role so a future mistake (e.g., accidentally using the anon client) fails loudly instead of silently.

---

### 2. No rate limiting on login / PIN entry — 📋 Open

`loginUserAction`, `loginAdminAction`, and `resetAdminPasswordWithCodeAction` accept attempts indefinitely with no throttling.

- A 4-digit PIN = **10,000 combinations** — brute-forceable in seconds at network speed.
- The admin reset code is 8 chars from a constrained alphabet — also brute-forceable without throttling.

**Fix plan:**

- Add rate limiting (e.g., `@upstash/ratelimit` + Vercel KV, or a DB-backed counter).
- Suggested: 5 failed attempts per username per 15 minutes; 20 attempts per IP per 15 minutes.
- Consider lockout escalation after sustained failures.

**Priority:** Highest remaining real risk. This is the right fix for brute-force concerns, not raising PIN length.

---

### 3. Session cookie lacks `secure` flag — ✅ Fixed (2026-06-11)

Added `secure: process.env.NODE_ENV === "production"` in `src/lib/session.ts`. Dev still works over HTTP; prod cookies are now only sent over HTTPS.

---

### 4. Session has no payload-level expiration — ⏸ Deferred

The encoded session has no `exp` field. The HMAC signature alone is valid forever. `maxAge` is a browser-side hint only; a stolen cookie remains valid until `SESSION_SECRET` is rotated.

**Risk:** Stolen / leaked cookies grant indefinite access.

**Decision (deferred):** For this app (anonymous task tracker, no high-value data), the UX cost of periodic re-login is non-trivial. The realistic threat is low. Revisit if:

- Cookie theft becomes a documented concern
- App grows to handle more sensitive data
- We add a "log out everywhere" / session revocation feature (in which case `exp` becomes a natural part of it)

**Workaround in the meantime:** Rotate `SESSION_SECRET` periodically (~ every 6 months) to invalidate all outstanding cookies.

---

## 🟡 Medium Severity

### 5. Image upload trusts user metadata — ✅ Fixed (2026-06-11)

Added extension allowlist (png/jpg/jpeg/webp/gif) and 5MB size cap to all image-uploading server actions (`createTaskAction`, `editTaskAction`, `createPersonalTaskAction`, `editPersonalTaskAction`).

**Still pending:** Manual verification that the `task-images` bucket is **private** in the Supabase dashboard (see #13).

---

### 6. Admin password reset code can be brute-forced — 📋 Open (tied to #2)

The reset code is 8 chars from a non-ambiguous alphabet (~30 chars). Combined with no rate limiting on `resetAdminPasswordWithCodeAction`, it's worth tightening.

**Fix plan:** Tie into the rate limiter from #2. Also consider invalidating all of an admin's outstanding codes when one is consumed.

---

### 7. No audit log for sensitive admin actions — 📋 Open

Actions like `rotateGroupCodeAction`, `rotateAdminInviteAction`, `removeUserAction`, `generateAdminResetCodeAction`, `adminResetMilestoneAction` have no audit trail.

**Risk:** If an admin account is compromised, no forensic record of what they touched.

**Fix plan:** Add an `audit_log` table:

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

### 8. Username regeneration / enumeration — 📋 Open (tied to #2)

`/join` lets a prospective user re-roll usernames against a group. With no rate limit, this could be used to enumerate existing members of a known group code.

**Risk:** Low (you need the group code first) but still an information leak.

**Fix plan:** Same rate limiter; cap regenerations per IP per minute.

---

## 🟢 Low Severity / Hardening

### 9. Security headers — ✅ Partial fix (2026-06-11) / 🚧 CSP deferred

Added to `next.config.ts`:

- ✅ `X-Frame-Options: DENY` — clickjacking defense
- ✅ `X-Content-Type-Options: nosniff` — MIME sniffing off
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Deferred:** Content Security Policy (CSP). A strict CSP needs careful tuning (Next.js hot reload, inline styles, Tailwind, fonts), and a report-only rollout to catch breakage. Not a "drop in" change — needs its own dedicated effort. Note: if we ever add a camera-based image capture, update the Permissions-Policy accordingly.

---

### 10. PIN minimum is 4 with no strength check — ⏸ Deferred

Users can pick `0000`, `1234`. Originally proposed bumping minimum to 6 digits.

**Decision (deferred):** Wrong tool for the job. The brute-force threat is better solved by **rate limiting** (#2) than by longer PINs. Forcing existing users to update PINs would cause friction and support load (no good PIN-reset flow exists). Once #2 lands, a 4-digit PIN with a 5-attempts-per-15-min lockout is fine for this app's threat model.

**Revisit if:** the app holds more sensitive data, or rate limiting alone proves insufficient.

---

### 11. Debug `console.log` in production code — ✅ Fixed (2026-06-11)

Removed verbose `console.log` / `console.error` from `editTaskAction`. Other actions don't log sensitive data.

---

### 12. CSRF — ℹ️ Acceptable as-is

Next.js 15+ does Origin checking on Server Actions automatically, which mitigates most CSRF. No explicit token needed for the current architecture. Revisit if a JSON API is ever added.

---

### 13. Verify `task-images` bucket privacy — ❓ Needs manual verification

Check the Supabase Storage dashboard — the bucket should be **private** (not "public"). If public, anyone with the URL can fetch any task image.

**Action item:** Manually verify in Supabase dashboard. If public, switch to private and confirm the app uses signed URLs (it does, via `createSignedUrl` in the Today page).

---

### 14. Service role key is a single point of failure — ℹ️ Acceptable as-is, operational

Rotate `SUPABASE_SERVICE_ROLE_KEY` periodically and treat it like a master password. Vercel project secrets only; never commit.

**Action item:** Set a calendar reminder to rotate the key every ~6 months. Same for `SESSION_SECRET`.

---

### 15. Reading-plan and feedback action ownership re-checks — 📋 Open

Most action handlers verify `group_id`, but spot-check each one — for example, ensure that when a user marks a reading plan day done, the action confirms the allocation belongs to that user, not just to the same group.

**Action item:** Review every action in `src/app/actions/plans.ts`, `reading.ts`, and `feedback.ts` for proper ownership checks (not just group-scope).

---

## 🔧 Remaining priority order

1. **#2 + #6 + #8** Rate limiting on login / PIN / reset / username regen. This is the highest leverage real fix.
2. **#7** Audit log for admin actions.
3. **#15** Spot-audit ownership checks in plans/reading/feedback actions.
4. **#13** Manually verify `task-images` bucket is private.
5. **#14** Calendar reminder for periodic key rotation.
6. **#1** Decide on RLS strategy when there's time (architectural).
7. **#4** Reconsider session `exp` if the threat model changes.
8. **#9 (CSP)** Dedicated CSP rollout when there's time.

---

## 📝 Change log

- **2026-06-11**
  - Fixed #3: `secure` cookie flag in production.
  - Fixed #5: Image upload validation (extension allowlist + 5MB cap) on admin and personal task actions.
  - Fixed #9 (partial): Added X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers.
  - Fixed #11: Removed debug `console.log` from `editTaskAction`.
  - Deferred #1: RLS strategy needs architectural decision.
  - Deferred #4: Session `exp` deferred; UX cost outweighs current threat.
  - Deferred #10: PIN length is the wrong fix; rate limiting (#2) is the right one.
- **2026-06-09**
  - Initial audit.

---

## Out of Scope

- **Penetration testing** — this audit is code-review based. A live pen test would surface additional issues (timing attacks, DoS thresholds, etc.).
- **Supabase dashboard config** — bucket policies, network rules, and SQL roles need to be verified inside Supabase.
- **Deployment platform** — Vercel-side config (env vars, custom domains, headers via dashboard) wasn't reviewed.
