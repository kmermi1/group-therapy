-- Admin can define a minimum number of completions per milestone for a task
-- (e.g., a weekly task that must be done at least 2x/week).
alter table tasks
  add column target_per_milestone smallint not null default 1
  check (target_per_milestone >= 1);
