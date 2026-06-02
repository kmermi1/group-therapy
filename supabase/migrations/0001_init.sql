-- Group Therapy schema
-- Privacy notes:
--   * No IP, email, or phone columns anywhere.
--   * All identifying data is the funny username chosen by the app.
--   * Auth is handled in the app layer (PIN / password hashed with bcrypt),
--     so we deliberately do NOT use Supabase Auth users. This avoids
--     storing emails and lets us keep identities purely group-scoped.

create extension if not exists pgcrypto;

-- Day of week: 0 = Sunday ... 6 = Saturday
create table groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  admin_invite_code text not null unique,
  name text not null,
  default_start_day smallint not null default 3 check (default_start_day between 0 and 6),
  milestone_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table admins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  username text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  unique (group_id, username)
);

create table users (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  username text not null,
  pin_hash text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- soft-archive: when a user does a "fresh start" rename
  archived_at timestamptz,
  unique (group_id, username)
);

create index users_group_active_idx on users (group_id) where archived_at is null;

-- Tracks previous usernames a user has used. Only created when the user
-- chose "keep history" on rename. Each row links the historical username
-- to the current user row.
create table username_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  old_username text not null,
  changed_at timestamptz not null default now()
);

create type task_frequency as enum ('daily', 'weekly');

create table tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  description text,
  image_path text, -- supabase storage path
  frequency task_frequency not null,
  target_per_milestone smallint not null default 1 check (target_per_milestone >= 1),
  total_target integer check (total_target is null or total_target >= 1),
  -- null = assigned to everyone in the group
  assignee_user_id uuid references users(id) on delete cascade,
  -- null = created by an admin; set for self-created personal tasks
  created_by_user_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index tasks_group_active_idx on tasks (group_id) where archived_at is null;

create table task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  -- for daily: the local date the task is for; for weekly: the milestone start date
  completed_for_date date not null,
  completed_at timestamptz not null default now(),
  unique (task_id, user_id, completed_for_date)
);

create index task_completions_user_idx on task_completions (user_id, completed_for_date);
create index task_completions_task_idx on task_completions (task_id, completed_for_date);

-- Past milestones — snapshotted on admin reset. Used to bound what the
-- admin can see (current milestone only). Users can still see across
-- all milestones unless they self-reset.
create table milestones (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index milestones_group_idx on milestones (group_id, ended_at desc);

-- Per-user self-reset point. completions before this timestamp are hidden
-- from the user's own history view (but not deleted, in case of accidents).
-- A user can clear this if they want their full history back.
create table user_history_resets (
  user_id uuid primary key references users(id) on delete cascade,
  reset_at timestamptz not null default now()
);

-- Row Level Security: the app uses the service-role key from server actions
-- for all writes and authenticated reads. RLS is enabled with a default
-- deny-all so that the public anon key cannot read anything directly.
alter table groups enable row level security;
alter table admins enable row level security;
alter table users enable row level security;
alter table username_history enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table milestones enable row level security;
alter table user_history_resets enable row level security;

-- (No policies created => deny-all for anon/authed roles. The service
-- role bypasses RLS, which is what our server actions use.)

-- Storage bucket for task images. Create via Supabase dashboard or:
--   insert into storage.buckets (id, name, public) values ('task-images', 'task-images', false);
