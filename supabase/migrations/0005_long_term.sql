-- Long-term goals: a task that accumulates completions across milestones
-- until total_target is reached (e.g., "read 604 pages of Quran").
-- When total_target is null, the task is a regular per-milestone task.
alter table tasks
  add column total_target integer
  check (total_target is null or total_target >= 1);
