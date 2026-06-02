-- Allow users to create personal tasks for themselves.
-- created_by_user_id is null for admin-created tasks, set for user-created ones.

alter table tasks
  add column created_by_user_id uuid references users(id) on delete cascade;

create index tasks_creator_idx on tasks (created_by_user_id);
