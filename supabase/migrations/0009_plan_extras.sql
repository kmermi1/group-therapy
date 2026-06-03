-- Extras: named single-slot claims attached to a reading plan
-- (e.g., a "Duha" closing supplement after the Quran or Jawshan).
-- For progressing plans, an extra is owed only on the final day.
-- For repeating plans, an extra is owed every day, just like a normal
-- unit range.

create table reading_plan_extras (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references reading_plans(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index reading_plan_extras_plan_idx on reading_plan_extras (plan_id, position);

alter table reading_plan_extras enable row level security;

-- An allocation row is either a unit range OR an extra, never both.
-- Make unit columns nullable and add extra_id.
alter table reading_plan_allocations
  alter column start_unit drop not null;

alter table reading_plan_allocations
  alter column end_unit drop not null;

alter table reading_plan_allocations
  add column extra_id uuid references reading_plan_extras(id) on delete cascade;

alter table reading_plan_allocations
  add constraint allocation_kind_check check (
    (extra_id is null and start_unit is not null and end_unit is not null)
    or
    (extra_id is not null and start_unit is null and end_unit is null)
  );
