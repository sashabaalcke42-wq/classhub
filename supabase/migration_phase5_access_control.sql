-- Run in Supabase SQL Editor

create table app_settings (
  key   text primary key,
  value text
);

-- Set a real code immediately after running this — 'changeme' is a
-- placeholder and anyone could guess it.
insert into app_settings (key, value) values ('signup_code', 'changeme')
  on conflict (key) do nothing;
