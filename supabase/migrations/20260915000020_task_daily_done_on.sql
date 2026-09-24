-- Lets any daily be ticked for today, skill or not.
-- Before this, only a Habitica-backed or skill-mapped daily carried a
-- completion state; a plain daily (e.g. "Morning operator") could not be
-- checked at all and a tick did not survive a reload.

alter table public.tasks
  add column if not exists daily_done_on date;
