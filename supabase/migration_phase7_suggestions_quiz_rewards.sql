-- Run in Supabase SQL Editor

create table suggestions (
  id           uuid primary key default gen_random_uuid(),
  account_name text references users(account_name) on delete set null,
  display_name text not null,
  title        text not null,
  body         text,
  status       text not null default 'open' check (status in ('open','planned','done','declined')),
  created_at   timestamptz not null default now()
);

create table suggestion_votes (
  suggestion_id uuid not null references suggestions(id) on delete cascade,
  account_name  text not null references users(account_name) on delete cascade,
  primary key (suggestion_id, account_name)
);

alter table quizzes add column if not exists reward_per_correct integer not null default 10;
