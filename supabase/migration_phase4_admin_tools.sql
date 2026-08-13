-- Run in Supabase SQL Editor

alter table users add column if not exists banned_until timestamptz; -- null = not banned, far future = permanent
alter table users add column if not exists ban_reason text;
alter table users add column if not exists session_version integer not null default 0; -- bump to force-logout a user

create table activity_log (
  id           uuid primary key default gen_random_uuid(),
  actor        text references users(account_name) on delete set null,  -- who did it (usually an admin)
  action       text not null,                                           -- e.g. 'password_reset', 'ban', 'coins_changed'
  target       text,                                                    -- account affected, if any
  detail       text,                                                    -- human-readable extra info
  created_at   timestamptz not null default now()
);
create index activity_log_created_idx on activity_log (created_at desc);
