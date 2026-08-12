-- Run in Supabase SQL Editor
alter table quizzes add column if not exists deleted_at timestamptz;
