-- Run in Supabase SQL Editor

alter table games add column if not exists reward_rate numeric not null default 1;      -- coins per point
alter table games add column if not exists daily_limit integer not null default 200;    -- max coins/day/user from this game
alter table games add column if not exists cooldown_seconds integer not null default 5; -- min gap between score submits

create table game_achievements (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  name           text not null,
  description    text,
  icon           text default '🏆',
  threshold_score integer not null,
  created_at     timestamptz not null default now()
);

create table user_achievements (
  account_name    text not null references users(account_name) on delete cascade,
  achievement_id  uuid not null references game_achievements(id) on delete cascade,
  unlocked_at     timestamptz not null default now(),
  primary key (account_name, achievement_id)
);

create table arcade_score_log (
  id            uuid primary key default gen_random_uuid(),
  account_name  text not null references users(account_name) on delete cascade,
  game_id       uuid not null references games(id) on delete cascade,
  score         integer not null,
  coins_awarded integer not null,
  created_at    timestamptz not null default now()
);
create index arcade_score_log_lookup on arcade_score_log (account_name, game_id, created_at);
