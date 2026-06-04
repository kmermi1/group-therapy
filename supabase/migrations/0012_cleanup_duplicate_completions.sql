-- Remove duplicate task completions, keeping only the oldest record per task/user/date
delete from task_completions
where id in (
  select id
  from (
    select
      id,
      row_number() over (partition by task_id, user_id, completed_for_date order by created_at) as rn
    from task_completions
  ) t
  where rn > 1
);

-- Ensure the unique constraint is properly defined (re-create it to be safe)
-- First drop if it exists
alter table task_completions drop constraint if exists task_completions_task_id_user_id_completed_for_date_key;

-- Then re-add it
alter table task_completions
add constraint task_completions_task_id_user_id_completed_for_date_key
unique (task_id, user_id, completed_for_date);
