-- Add timezone support to groups
alter table groups add column timezone text not null default 'America/New_York';

-- Create an index for faster lookups
create index groups_timezone_idx on groups(timezone);
