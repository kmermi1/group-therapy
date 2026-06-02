-- In-app feedback. Members or admins can submit to their group's inbox.
-- If is_anonymous = true, neither from_user_id nor from_admin_id is set.

create table feedback (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_user_id uuid references users(id) on delete set null,
  from_admin_id uuid references admins(id) on delete set null,
  is_anonymous boolean not null default false,
  message text not null,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create index feedback_group_idx on feedback (group_id, resolved, created_at desc);

alter table feedback enable row level security;
