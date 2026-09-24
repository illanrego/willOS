-- Workout V2: flexible routines, draft/completed sessions, and Strong-compatible entries.

create table if not exists public.workout_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  code text not null check (code in ('A', 'B', 'C', 'D', 'E', 'F')),
  name text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_routines_name_not_blank check (length(btrim(name)) > 0),
  constraint workout_routines_position_nonnegative check (position >= 0),
  constraint workout_routines_plan_same_user foreign key (user_id, workout_plan_id)
    references public.workout_plans(user_id, id) on delete cascade,
  unique (user_id, id),
  unique (user_id, workout_plan_id, code)
);

create table if not exists public.workout_routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  routine_id uuid not null references public.workout_routines(id) on delete cascade,
  exercise_id uuid references public.workout_exercises(id),
  exercise_name text not null,
  position integer not null default 0,
  target_sets integer,
  target_reps text,
  target_weight_kg numeric,
  rest_seconds integer,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_routine_exercises_name_not_blank check (length(btrim(exercise_name)) > 0),
  constraint workout_routine_exercises_position_nonnegative check (position >= 0),
  constraint workout_routine_exercises_target_sets_positive check (target_sets is null or target_sets > 0),
  constraint workout_routine_exercises_target_weight_nonnegative check (target_weight_kg is null or target_weight_kg >= 0),
  constraint workout_routine_exercises_rest_nonnegative check (rest_seconds is null or rest_seconds >= 0),
  constraint workout_routine_exercises_routine_same_user foreign key (user_id, routine_id)
    references public.workout_routines(user_id, id) on delete cascade,
  constraint workout_routine_exercises_exercise_same_user foreign key (user_id, exercise_id)
    references public.workout_exercises(user_id, id),
  unique (user_id, routine_id, position)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  routine_id uuid,
  routine_code text check (routine_code is null or routine_code in ('A', 'B', 'C', 'D', 'E', 'F')),
  workout_name text not null,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  workout_date date not null,
  started_at timestamptz not null,
  duration_seconds integer,
  workout_notes text not null default '',
  source text not null default 'startpage' check (source in ('startpage', 'strong_import', 'gamify')),
  external_workout_number text,
  external_key text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_name_not_blank check (length(btrim(workout_name)) > 0),
  constraint workout_sessions_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint workout_sessions_completion_consistent check (
    (status = 'draft' and completed_at is null) or
    (status = 'completed' and completed_at is not null)
  ),
  constraint workout_sessions_routine_same_user foreign key (user_id, routine_id)
    references public.workout_routines(user_id, id) on delete restrict,
  unique (user_id, id),
  unique (user_id, external_key)
);

create table if not exists public.workout_session_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.workout_exercises(id),
  exercise_name text not null,
  entry_order integer not null,
  set_order text not null,
  weight_kg numeric,
  reps numeric,
  rpe numeric,
  distance_meters numeric,
  seconds numeric,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_session_entries_exercise_not_blank check (length(btrim(exercise_name)) > 0),
  constraint workout_session_entries_set_order_not_blank check (length(btrim(set_order)) > 0),
  constraint workout_session_entries_order_nonnegative check (entry_order >= 0),
  constraint workout_session_entries_weight_nonnegative check (weight_kg is null or weight_kg >= 0),
  constraint workout_session_entries_reps_nonnegative check (reps is null or reps >= 0),
  constraint workout_session_entries_rpe_range check (rpe is null or (rpe >= 0 and rpe <= 10)),
  constraint workout_session_entries_distance_nonnegative check (distance_meters is null or distance_meters >= 0),
  constraint workout_session_entries_seconds_nonnegative check (seconds is null or seconds >= 0),
  constraint workout_session_entries_session_same_user foreign key (user_id, workout_session_id)
    references public.workout_sessions(user_id, id) on delete cascade,
  constraint workout_session_entries_exercise_same_user foreign key (user_id, exercise_id)
    references public.workout_exercises(user_id, id),
  unique (user_id, workout_session_id, entry_order)
);

create index if not exists workout_routines_user_plan_idx
  on public.workout_routines (user_id, workout_plan_id, position);
create index if not exists workout_routine_exercises_user_routine_idx
  on public.workout_routine_exercises (user_id, routine_id, position);
create index if not exists workout_sessions_user_date_idx
  on public.workout_sessions (user_id, workout_date desc, started_at desc);
create index if not exists workout_sessions_user_status_idx
  on public.workout_sessions (user_id, status, workout_date desc);
create index if not exists workout_session_entries_user_session_idx
  on public.workout_session_entries (user_id, workout_session_id, entry_order);
create index if not exists workout_session_entries_user_exercise_idx
  on public.workout_session_entries (user_id, exercise_id, created_at desc);

create trigger workout_routines_set_updated_at before update on public.workout_routines
for each row execute function public.set_updated_at();
create trigger workout_routine_exercises_set_updated_at before update on public.workout_routine_exercises
for each row execute function public.set_updated_at();
create trigger workout_sessions_set_updated_at before update on public.workout_sessions
for each row execute function public.set_updated_at();
create trigger workout_session_entries_set_updated_at before update on public.workout_session_entries
for each row execute function public.set_updated_at();

alter table public.workout_routines enable row level security;
alter table public.workout_routine_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_entries enable row level security;

create policy "workout_routines_all_own" on public.workout_routines
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_routine_exercises_all_own" on public.workout_routine_exercises
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_sessions_all_own" on public.workout_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_session_entries_all_own" on public.workout_session_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
