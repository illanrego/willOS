-- Notes window for Startpage.
-- Home for the free-form notepad content that used to live in Habitica habits
-- (job-search links, icon galleries, the comic-course outline, the word-count
-- levels table, story ideas). One row per section; the window renders the rows
-- in sort_order and edits them in place.

create table if not exists public.notes_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  slug text not null,
  title text not null,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_sections_slug_not_blank check (length(btrim(slug)) > 0),
  constraint notes_sections_title_not_blank check (length(btrim(title)) > 0),
  constraint notes_sections_sort_order_nonnegative check (sort_order >= 0),
  unique (user_id, slug),
  unique (user_id, id)
);

create index if not exists notes_sections_user_sort_idx
  on public.notes_sections (user_id, sort_order, created_at);

drop trigger if exists notes_sections_set_updated_at on public.notes_sections;
create trigger notes_sections_set_updated_at before update on public.notes_sections
for each row execute function public.set_updated_at();

alter table public.notes_sections enable row level security;

drop policy if exists "notes_sections_all_own" on public.notes_sections;
create policy "notes_sections_all_own" on public.notes_sections
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
