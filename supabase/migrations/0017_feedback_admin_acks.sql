create table feedback_admin_acks (
  feedback_id uuid not null references feedback(id) on delete cascade,
  admin_id uuid not null references admins(id) on delete cascade,
  acked_at timestamptz not null default now(),
  primary key (feedback_id, admin_id)
);

create index feedback_admin_acks_admin_idx on feedback_admin_acks(admin_id);
