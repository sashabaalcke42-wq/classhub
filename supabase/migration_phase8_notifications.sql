-- Run in Supabase SQL Editor

alter table users add column if not exists desktop_notifications boolean not null default false;

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  account_name text not null references users(account_name) on delete cascade,
  type         text not null,
  title        text not null,
  body         text,
  link         text,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);
create index notifications_account_idx on notifications (account_name, created_at desc);
