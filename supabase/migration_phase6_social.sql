-- Run in Supabase SQL Editor

-- Denormalize avatar onto messages (same pattern already used for display_name)
alter table messages add column if not exists avatar_path text;

-- Pinning
alter table messages add column if not exists pinned boolean not null default false;
alter table messages add column if not exists pinned_by text references users(account_name) on delete set null;
alter table messages add column if not exists pinned_at timestamptz;

-- Group roles: creator is auto-admin; admins can rename, remove members, promote others
alter table group_members add column if not exists role text not null default 'member' check (role in ('member','admin'));
update group_members gm set role = 'admin'
  from groups g where g.id = gm.group_id and g.created_by = gm.account_name and gm.role = 'member';

-- Polls
alter table messages add column if not exists message_type text not null default 'text' check (message_type in ('text','poll'));
alter table messages add column if not exists poll_question text;
alter table messages add column if not exists poll_options jsonb;

create table poll_votes (
  message_id   uuid not null references messages(id) on delete cascade,
  account_name text not null references users(account_name) on delete cascade,
  option_index integer not null,
  voted_at     timestamptz not null default now(),
  primary key (message_id, account_name)
);
