-- Run this in Supabase SQL Editor on your live project.

create table quizzes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  created_by  text references users(account_name) on delete set null,
  release_at  timestamptz,        -- null = available immediately
  end_at      timestamptz,        -- null = never closes
  created_at  timestamptz not null default now()
);

create table quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references quizzes(id) on delete cascade,
  order_index   integer not null,
  type          text not null check (type in ('true_false', 'multiple_choice', 'written')),
  question_text text not null,
  options       jsonb,            -- array of strings, multiple_choice only
  correct_answer text,            -- 'true'/'false' or the correct option text; null for written
  timer_seconds integer           -- optional per-question timer
);

create table quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  account_name text not null references users(account_name) on delete cascade,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz,
  unique (quiz_id, account_name)  -- one attempt per quiz per person
);

create table quiz_responses (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  answer_text text,
  is_correct  boolean,            -- null = ungraded (written answers start here)
  graded_by   text references users(account_name) on delete set null,
  graded_at   timestamptz
);
create index quiz_responses_attempt_idx on quiz_responses (attempt_id);
