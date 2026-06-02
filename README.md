# Group Therapy

A small, mobile-first web app for a group of friends to keep each other motivated on weekly tasks (including religious / habit tracking). Identities are anonymous funny usernames; only an admin assigns tasks.

## Features

- **Admin creates a group** with a name, a default milestone start day, and an admin username + password.
- **Friends join** with the group code. The app generates a funny username (e.g. `GrumpyOtter42`) — they pick a PIN. A 🎲 **Regenerate** button is available at signup *and* on the profile page, so anyone can roll a new name at any time.
- **Tasks**: admin creates daily or weekly tasks, assigned to everyone or one specific person, with an optional image.
- **Completion**: users check off tasks themselves.
- **Leaderboard**: everyone sees everyone else's current-milestone progress under their funny names.
- **History**: each user has a full personal history (own view only). Users can self-reset to hide everything before now.
- **Milestones**: admin sees only the current milestone. Reset manually any time. If the admin doesn't reset, the milestone auto-rolls each week on the group's default start day.
- **Rename**: regenerating your username asks "keep history" or "fresh start".
- **Admin can see** each user's last-login time on the dashboard.

## Tech

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (Postgres + Storage).

Auth is custom (no email, no Supabase Auth): bcrypt-hashed PIN/password + signed cookie session. This keeps PII out entirely.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, paste and run `supabase/migrations/0001_init.sql`.
3. In Supabase **Storage**, create a private bucket named `task-images`.
4. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` from the same page (keep this secret — server only).
   - `SESSION_SECRET` — any long random string (`openssl rand -base64 32`).
5. Install + run:
   ```sh
   npm install
   npm run dev
   ```
6. Visit http://localhost:3000.

## Deploy

Push the repo to GitHub. On [vercel.com](https://vercel.com), import the GitHub repo. Add the same four env vars in **Project → Settings → Environment Variables**. Vercel rebuilds on every push.

## Privacy / threat model

The promise to your friends is **"no other member of this group can identify you from the app."** Concretely:

- No emails, phone numbers, or real names are stored.
- No IP addresses, user-agents, or device fingerprints are written to the database. The app never reads `request.ip` or `x-forwarded-for`.
- No third-party analytics scripts. Fonts are bundled (no Google Fonts network calls at runtime).
- All cross-user data access goes through server actions that scope by `group_id`.
- Row Level Security is enabled with default deny-all on every table; only the server-side service-role key (not exposed to the browser) can read/write.

**What this does NOT protect against:**
- Your hosting provider (Vercel) sees source IPs at the edge. If that matters to your group, self-host on a VPS where you control logs.
- Supabase the company can see DB rows. The schema is intentionally minimal so what they could see is also minimal.
- A user voluntarily revealing their username to others.
- Someone who learns another user's username + PIN can impersonate them — pick a non-obvious PIN.
