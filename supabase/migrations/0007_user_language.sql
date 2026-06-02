-- Per-user language preference. Two-letter ISO codes.
alter table users
  add column language text not null default 'en'
  check (language in ('en', 'tr'));
