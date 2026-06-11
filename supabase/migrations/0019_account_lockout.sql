alter table users add column locked_at timestamptz;
alter table admins add column locked_at timestamptz;

create index users_locked_idx on users(locked_at) where locked_at is not null;
create index admins_locked_idx on admins(locked_at) where locked_at is not null;
