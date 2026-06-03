-- Admin password reset codes for self-service password recovery
-- One admin can generate a reset code for another admin in the same group

create table admin_password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by_admin_id uuid references admins(id) on delete set null
);

create index admin_password_reset_codes_admin_idx on admin_password_reset_codes(admin_id);
create index admin_password_reset_codes_code_idx on admin_password_reset_codes(code) where used_at is null;

alter table admin_password_reset_codes enable row level security;
