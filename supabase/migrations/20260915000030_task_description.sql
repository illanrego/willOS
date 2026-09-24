-- A short description on any task, so a daily can state what ticking it means.
-- First use: "Morning operator" - done means the day's nerd clip is posted.

alter table public.tasks
  add column if not exists description text;
