-- Reading plans: long-running, day-by-day shared reading tasks
-- (e.g., Quran in 30 days, Jawshan daily forever).
--
-- A plan has either:
--   * progressing schedule: each day has a generated label (e.g. "Cüz 15"),
--     advancing by 1 each calendar day from start_at for total_days days.
--   * repeating schedule: every day is "today's reading", no label, runs
--     until admin closes.
--
-- Members claim ranges of the unit list (pages 1..N). Ranges can be
-- non-contiguous (a user may own several disjoint ranges). Each range
-- row has from_day / to_day (inclusive, 1-based plan day) so admin edits
-- and user releases keep history intact for past days.

create type plan_schedule as enum ('progressing', 'repeating');
create type plan_status as enum ('active', 'closed');

create table reading_plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  unit_label text not null,                                       -- "page", "bab"
  units_per_day int not null check (units_per_day >= 1),
  block_size int not null default 1 check (block_size >= 1),
  schedule plan_schedule not null,
  day_label_template text,                                        -- e.g. "Cüz {n}", null for repeating
  start_at int,                                                   -- starting {n} value (progressing only)
  total_days int,                                                 -- only set for progressing
  start_date date not null,                                       -- when plan day 1 happens (NY local)
  status plan_status not null default 'active',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index reading_plans_group_idx on reading_plans (group_id, status);

-- Each row is a single contiguous range. A user may have many rows in
-- the same plan (non-contiguous ranges). from_day/to_day bound the
-- temporal validity so history of past allocations is preserved when
-- admin edits or user releases.
create table reading_plan_allocations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references reading_plans(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  start_unit int not null check (start_unit >= 1),
  end_unit int not null check (end_unit >= start_unit),
  from_day int not null check (from_day >= 1),                    -- inclusive
  to_day int check (to_day is null or to_day >= from_day),        -- inclusive; null = ongoing
  created_at timestamptz not null default now()
);

create index reading_plan_allocations_plan_idx on reading_plan_allocations (plan_id);
create index reading_plan_allocations_user_idx on reading_plan_allocations (plan_id, user_id);

-- One completion row per user per plan day. Marks the user as having
-- finished their (current-at-time-of-day) range for that plan day.
create table reading_plan_completions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references reading_plans(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  plan_day int not null check (plan_day >= 1),
  completed_at timestamptz not null default now(),
  unique (plan_id, user_id, plan_day)
);

create index reading_plan_completions_plan_idx on reading_plan_completions (plan_id, plan_day);

alter table reading_plans enable row level security;
alter table reading_plan_allocations enable row level security;
alter table reading_plan_completions enable row level security;
