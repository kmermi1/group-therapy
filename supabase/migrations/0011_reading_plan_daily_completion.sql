create table reading_plan_daily_completion (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null references reading_plan_allocations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  completed_for_date date not null,
  created_at timestamptz not null default now()
);

create index reading_plan_daily_completion_allocation_idx on reading_plan_daily_completion(allocation_id);
create index reading_plan_daily_completion_user_idx on reading_plan_daily_completion(user_id);
create index reading_plan_daily_completion_date_idx on reading_plan_daily_completion(completed_for_date);
create unique index reading_plan_daily_completion_unique_idx on reading_plan_daily_completion(allocation_id, completed_for_date, user_id);
