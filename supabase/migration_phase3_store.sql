-- Run in Supabase SQL Editor

create table store_games (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  storage_path  text not null,
  price         integer not null default 0,
  status        text not null default 'pending' check (status in ('pending','approved','rejected','needs_changes')),
  submitted_by  text references users(account_name) on delete set null,
  review_note   text,
  created_at    timestamptz not null default now()
);

create table store_purchases (
  account_name text not null references users(account_name) on delete cascade,
  game_id      uuid not null references store_games(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (account_name, game_id)
);
