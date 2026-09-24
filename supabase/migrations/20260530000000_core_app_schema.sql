-- Startpage core app schema.
-- Run this in Supabase before enabling the frontend backend mode.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Sao_Paulo',
  default_currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  wallpaper text,
  window_layout jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  legacy_id text,
  name text not null,
  color_index integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_categories_name_not_blank check (length(btrim(name)) > 0),
  constraint finance_categories_color_index_nonnegative check (color_index >= 0),
  unique (user_id, legacy_id),
  unique (user_id, id)
);

create table if not exists public.finance_month_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  month_key text not null,
  monthly_budget numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_month_budgets_month_key_format check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint finance_month_budgets_amount_nonnegative check (monthly_budget >= 0),
  unique (user_id, month_key),
  unique (user_id, id)
);

create table if not exists public.finance_budget_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  month_budget_id uuid not null references public.finance_month_budgets(id) on delete cascade,
  category_id uuid not null references public.finance_categories(id),
  allocated_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_budget_allocations_amount_nonnegative check (allocated_amount >= 0),
  constraint finance_budget_allocations_budget_same_user foreign key (user_id, month_budget_id) references public.finance_month_budgets(user_id, id) on delete cascade,
  constraint finance_budget_allocations_category_same_user foreign key (user_id, category_id) references public.finance_categories(user_id, id),
  unique (user_id, month_budget_id, category_id)
);

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  legacy_id text,
  happened_on date not null,
  entry_type text not null check (entry_type in ('income', 'expense')),
  category_id uuid references public.finance_categories(id),
  amount numeric(12, 2) not null check (amount >= 0),
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_entries_note_not_blank check (length(btrim(note)) > 0),
  constraint finance_entries_category_same_user foreign key (user_id, category_id) references public.finance_categories(user_id, id),
  unique (user_id, legacy_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  legacy_id text,
  text text not null,
  task_type text not null default 'todo' check (task_type in ('todo', 'daily')),
  source text not null default 'local' check (source in ('local', 'habitica')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint tasks_text_not_blank check (length(btrim(text)) > 0),
  unique (user_id, legacy_id),
  unique (user_id, id)
);

create table if not exists public.task_external_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  provider text not null,
  external_task_id text not null,
  external_type text,
  external_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_external_links_task_same_user foreign key (user_id, task_id) references public.tasks(user_id, id) on delete cascade,
  unique (user_id, provider, external_task_id)
);

create table if not exists public.kanban_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null default 'Main',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kanban_boards_title_not_blank check (length(btrim(title)) > 0),
  unique (user_id, id)
);

create table if not exists public.kanban_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  board_id uuid not null references public.kanban_boards(id) on delete cascade,
  code text not null,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kanban_columns_code_not_blank check (length(btrim(code)) > 0),
  constraint kanban_columns_title_not_blank check (length(btrim(title)) > 0),
  constraint kanban_columns_position_nonnegative check (position >= 0),
  constraint kanban_columns_board_same_user foreign key (user_id, board_id) references public.kanban_boards(user_id, id) on delete cascade,
  unique (user_id, id),
  unique (user_id, board_id, id),
  unique (user_id, board_id, code)
);

create table if not exists public.kanban_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  board_id uuid not null references public.kanban_boards(id) on delete cascade,
  column_id uuid not null references public.kanban_columns(id) on delete cascade,
  text text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kanban_cards_text_not_blank check (length(btrim(text)) > 0),
  constraint kanban_cards_position_nonnegative check (position >= 0),
  constraint kanban_cards_board_same_user foreign key (user_id, board_id) references public.kanban_boards(user_id, id) on delete cascade,
  constraint kanban_cards_column_same_board foreign key (user_id, board_id, column_id) references public.kanban_columns(user_id, board_id, id) on delete cascade
);

create table if not exists public.trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null check (kind in ('skill', 'counter')),
  code text not null,
  label text not null,
  color text,
  day_max integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trackers_code_not_blank check (length(btrim(code)) > 0),
  constraint trackers_label_not_blank check (length(btrim(label)) > 0),
  constraint trackers_day_max_positive check (day_max is null or day_max > 0),
  unique (user_id, id),
  unique (user_id, code)
);

create table if not exists public.tracker_daily_values (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  tracked_on date not null,
  value integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tracker_daily_values_nonnegative check (value >= 0),
  constraint tracker_daily_values_tracker_same_user foreign key (user_id, tracker_id) references public.trackers(user_id, id) on delete cascade,
  unique (user_id, tracker_id, tracked_on)
);

create table if not exists public.calendar_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  note_date date not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_notes_note_not_blank check (length(btrim(note)) > 0),
  unique (user_id, note_date)
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_exercises_name_not_blank check (length(btrim(name)) > 0),
  unique (user_id, id),
  unique (user_id, name)
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  mode text not null default 'week' check (mode in ('week', 'sessions')),
  title text,
  is_active boolean not null default true,
  saved_snapshot_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.workout_plan_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  column_index integer not null,
  row_index integer not null,
  slot_label text,
  exercise_id uuid references public.workout_exercises(id),
  exercise_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_plan_slots_column_nonnegative check (column_index >= 0),
  constraint workout_plan_slots_row_nonnegative check (row_index >= 0),
  constraint workout_plan_slots_plan_same_user foreign key (user_id, workout_plan_id) references public.workout_plans(user_id, id) on delete cascade,
  constraint workout_plan_slots_exercise_same_user foreign key (user_id, exercise_id) references public.workout_exercises(user_id, id),
  unique (user_id, workout_plan_id, column_index, row_index)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recommendations_text_not_blank check (length(btrim(text)) > 0)
);

create table if not exists public.feature_backlog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  text text not null,
  status text not null default 'open' check (status in ('open', 'done', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_backlog_items_text_not_blank check (length(btrim(text)) > 0)
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  provider text not null,
  external_user_id text,
  status text not null default 'active' check (status in ('active', 'disabled', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrations_provider_not_blank check (length(btrim(provider)) > 0),
  unique (user_id, provider)
);

create index if not exists finance_entries_user_date_idx on public.finance_entries (user_id, happened_on desc);
create index if not exists finance_entries_user_created_idx on public.finance_entries (user_id, created_at desc);
create index if not exists finance_entries_user_category_idx on public.finance_entries (user_id, category_id);
create index if not exists tasks_user_completed_idx on public.tasks (user_id, completed_at);
create index if not exists kanban_cards_user_column_idx on public.kanban_cards (user_id, column_id, position);
create index if not exists tracker_daily_values_user_date_idx on public.tracker_daily_values (user_id, tracked_on desc);
create index if not exists calendar_notes_user_date_idx on public.calendar_notes (user_id, note_date desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists finance_categories_set_updated_at on public.finance_categories;
create trigger finance_categories_set_updated_at before update on public.finance_categories
for each row execute function public.set_updated_at();

drop trigger if exists finance_month_budgets_set_updated_at on public.finance_month_budgets;
create trigger finance_month_budgets_set_updated_at before update on public.finance_month_budgets
for each row execute function public.set_updated_at();

drop trigger if exists finance_budget_allocations_set_updated_at on public.finance_budget_allocations;
create trigger finance_budget_allocations_set_updated_at before update on public.finance_budget_allocations
for each row execute function public.set_updated_at();

drop trigger if exists finance_entries_set_updated_at on public.finance_entries;
create trigger finance_entries_set_updated_at before update on public.finance_entries
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists task_external_links_set_updated_at on public.task_external_links;
create trigger task_external_links_set_updated_at before update on public.task_external_links
for each row execute function public.set_updated_at();

drop trigger if exists kanban_boards_set_updated_at on public.kanban_boards;
create trigger kanban_boards_set_updated_at before update on public.kanban_boards
for each row execute function public.set_updated_at();

drop trigger if exists kanban_columns_set_updated_at on public.kanban_columns;
create trigger kanban_columns_set_updated_at before update on public.kanban_columns
for each row execute function public.set_updated_at();

drop trigger if exists kanban_cards_set_updated_at on public.kanban_cards;
create trigger kanban_cards_set_updated_at before update on public.kanban_cards
for each row execute function public.set_updated_at();

drop trigger if exists trackers_set_updated_at on public.trackers;
create trigger trackers_set_updated_at before update on public.trackers
for each row execute function public.set_updated_at();

drop trigger if exists tracker_daily_values_set_updated_at on public.tracker_daily_values;
create trigger tracker_daily_values_set_updated_at before update on public.tracker_daily_values
for each row execute function public.set_updated_at();

drop trigger if exists calendar_notes_set_updated_at on public.calendar_notes;
create trigger calendar_notes_set_updated_at before update on public.calendar_notes
for each row execute function public.set_updated_at();

drop trigger if exists workout_exercises_set_updated_at on public.workout_exercises;
create trigger workout_exercises_set_updated_at before update on public.workout_exercises
for each row execute function public.set_updated_at();

drop trigger if exists workout_plans_set_updated_at on public.workout_plans;
create trigger workout_plans_set_updated_at before update on public.workout_plans
for each row execute function public.set_updated_at();

drop trigger if exists workout_plan_slots_set_updated_at on public.workout_plan_slots;
create trigger workout_plan_slots_set_updated_at before update on public.workout_plan_slots
for each row execute function public.set_updated_at();

drop trigger if exists recommendations_set_updated_at on public.recommendations;
create trigger recommendations_set_updated_at before update on public.recommendations
for each row execute function public.set_updated_at();

drop trigger if exists feature_backlog_items_set_updated_at on public.feature_backlog_items;
create trigger feature_backlog_items_set_updated_at before update on public.feature_backlog_items
for each row execute function public.set_updated_at();

drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at before update on public.integrations
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_month_budgets enable row level security;
alter table public.finance_budget_allocations enable row level security;
alter table public.finance_entries enable row level security;
alter table public.tasks enable row level security;
alter table public.task_external_links enable row level security;
alter table public.kanban_boards enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.kanban_cards enable row level security;
alter table public.trackers enable row level security;
alter table public.tracker_daily_values enable row level security;
alter table public.calendar_notes enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_slots enable row level security;
alter table public.recommendations enable row level security;
alter table public.feature_backlog_items enable row level security;
alter table public.integrations enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings_all_own" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_categories_all_own" on public.finance_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_month_budgets_all_own" on public.finance_month_budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_budget_allocations_all_own" on public.finance_budget_allocations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_entries_all_own" on public.finance_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_all_own" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_external_links_all_own" on public.task_external_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kanban_boards_all_own" on public.kanban_boards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kanban_columns_all_own" on public.kanban_columns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kanban_cards_all_own" on public.kanban_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trackers_all_own" on public.trackers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tracker_daily_values_all_own" on public.tracker_daily_values for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar_notes_all_own" on public.calendar_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_exercises_all_own" on public.workout_exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_plans_all_own" on public.workout_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_plan_slots_all_own" on public.workout_plan_slots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recommendations_all_own" on public.recommendations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "feature_backlog_items_all_own" on public.feature_backlog_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "integrations_all_own" on public.integrations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
