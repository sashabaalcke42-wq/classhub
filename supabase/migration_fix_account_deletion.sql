-- Run this in Supabase SQL Editor on your live project.
-- Fixes: deleting a user account fails silently if they've ever sent a
-- message, created a group, or added a game, because those tables
-- reference users(account_name) without permission to cascade.

-- Messages: delete a user's messages along with their account.
alter table messages drop constraint if exists messages_from_account_fkey;
alter table messages add constraint messages_from_account_fkey
  foreign key (from_account) references users(account_name) on delete cascade;

-- Games: keep the game, just detach the "added by" attribution.
alter table games alter column added_by drop not null;
alter table games drop constraint if exists games_added_by_fkey;
alter table games add constraint games_added_by_fkey
  foreign key (added_by) references users(account_name) on delete set null;

-- Groups: keep the group (and its other members), just detach ownership.
alter table groups alter column created_by drop not null;
alter table groups drop constraint if exists groups_created_by_fkey;
alter table groups add constraint groups_created_by_fkey
  foreign key (created_by) references users(account_name) on delete set null;
