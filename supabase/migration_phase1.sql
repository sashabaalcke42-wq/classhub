-- Run this in Supabase SQL Editor on your EXISTING project (don't re-run schema.sql)

alter table users add column if not exists avatar_path text;
alter table users add column if not exists bio text;
alter table users add column if not exists credits integer not null default 100;

create table if not exists blocks (
  blocker text not null references users(account_name) on delete cascade,
  blocked text not null references users(account_name) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

-- Give existing accounts (created before this migration) their starting credits
update users set credits = 100 where credits is null;
