-- Content board: which content lane posted on which day.
-- Simple per-day per-lane marks; the Content window renders them as a month
-- board and the kickoff/pipeline can record posts here. Idempotent so it is
-- safe to run twice in the SQL editor.

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  lane text not null,
  posted_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_posts_lane_valid
    check (lane in ('standup', 'comics', 'moc', 'teacher', 'freela')),
  unique (user_id, lane, posted_on)
);

create index if not exists content_posts_user_date_idx
  on public.content_posts (user_id, posted_on desc);

drop trigger if exists content_posts_set_updated_at on public.content_posts;
create trigger content_posts_set_updated_at before update on public.content_posts
for each row execute function public.set_updated_at();

alter table public.content_posts enable row level security;

drop policy if exists "content_posts_all_own" on public.content_posts;
create policy "content_posts_all_own" on public.content_posts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
