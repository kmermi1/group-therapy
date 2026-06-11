-- Track failed login attempts so admins can see brute-force activity.
create table failed_logins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  kind text not null check (kind in ('user', 'admin')),
  attempted_username text not null,
  ip text,
  rate_limited boolean not null default false,
  created_at timestamptz not null default now()
);

create index failed_logins_group_created_idx
  on failed_logins(group_id, created_at desc);

-- Per-admin cursor: when did this admin last acknowledge the failed-login feed?
create table admin_failed_login_acks (
  admin_id uuid primary key references admins(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);
