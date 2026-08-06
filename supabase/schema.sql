-- Run this whole file once in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create extension if not exists pgcrypto;

create table users (
  account_name  text primary key,
  display_name  text not null,
  password_hash text not null,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table friend_requests (
  id           uuid primary key default gen_random_uuid(),
  from_account text not null references users(account_name) on delete cascade,
  to_account   text not null references users(account_name) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (from_account, to_account)
);

create table friends (
  account_a  text not null references users(account_name) on delete cascade,
  account_b  text not null references users(account_name) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_a, account_b)
);

create table groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by text not null references users(account_name),
  created_at timestamptz not null default now()
);

create table group_members (
  group_id     uuid not null references groups(id) on delete cascade,
  account_name text not null references users(account_name) on delete cascade,
  primary key (group_id, account_name)
);

-- scope = 'global' | 'group' | 'dm'
-- dm_key = the two account names sorted alphabetically and joined with '__'
create table messages (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null check (scope in ('global','group','dm')),
  group_id     uuid references groups(id) on delete cascade,
  dm_key       text,
  from_account text not null references users(account_name),
  display_name text not null,
  is_admin     boolean not null default false,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index messages_global_group_idx on messages (scope, group_id, created_at);
create index messages_dm_idx on messages (scope, dm_key, created_at);

create table games (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  storage_path  text not null, -- folder inside the "games" storage bucket
  added_by      text not null references users(account_name),
  created_at    timestamptz not null default now()
);

-- ---------- Row Level Security ----------
-- All INSERT/UPDATE/DELETE happens only through server-side API routes using
-- the service_role key, which bypasses RLS entirely. The public anon key
-- (embedded in the browser bundle) is used ONLY to subscribe to realtime
-- updates on global/group chat, so we open SELECT for just those two scopes.
-- DMs are deliberately left unreadable by the anon key -- they can only be
-- fetched through the authenticated /api/dms route on the server.

alter table messages enable row level security;

create policy "read global and group messages"
  on messages for select
  using (scope in ('global', 'group'));

-- No insert/update/delete policy is created for the anon/public role,
-- which means the anon key can never write to this table -- only the
-- service_role key (server-only) can.
