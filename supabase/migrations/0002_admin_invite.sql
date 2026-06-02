-- Adds an admin-invite code distinct from the user-join code.
-- Anyone with this code can register as a co-admin of the group.

alter table groups
  add column admin_invite_code text unique;

-- Backfill any existing rows with a placeholder; the admin can rotate it.
update groups set admin_invite_code = upper(substr(md5(random()::text), 1, 8))
where admin_invite_code is null;

alter table groups alter column admin_invite_code set not null;
