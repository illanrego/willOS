-- Planner horizon layer for Startpage.
-- Holds one active period plan between strategy docs and daily execution.

create table if not exists public.planner_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  summary text not null,
  primary_lane text not null,
  hedge_lane text not null,
  floor_lane text not null,
  milestones jsonb not null default '[]'::jsonb,
  weekly_blocks jsonb not null default '[]'::jsonb,
  sprints jsonb not null default '{"activeSprint": null, "sprintLog": []}'::jsonb,
  review_on date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_plans_title_not_blank check (length(btrim(title)) > 0),
  constraint planner_plans_summary_not_blank check (length(btrim(summary)) > 0),
  constraint planner_plans_primary_lane_not_blank check (length(btrim(primary_lane)) > 0),
  constraint planner_plans_hedge_lane_not_blank check (length(btrim(hedge_lane)) > 0),
  constraint planner_plans_floor_lane_not_blank check (length(btrim(floor_lane)) > 0),
  constraint planner_plans_date_order check (ends_on >= starts_on),
  constraint planner_plans_milestones_array check (jsonb_typeof(milestones) = 'array'),
  constraint planner_plans_weekly_blocks_array check (jsonb_typeof(weekly_blocks) = 'array'),
  constraint planner_plans_sprints_object check (jsonb_typeof(sprints) = 'object'),
  unique (user_id, id),
  unique (user_id, status)
);

create index if not exists planner_plans_user_status_idx on public.planner_plans (user_id, status, starts_on desc);

drop trigger if exists planner_plans_set_updated_at on public.planner_plans;
create trigger planner_plans_set_updated_at before update on public.planner_plans
for each row execute function public.set_updated_at();

alter table public.planner_plans enable row level security;

create policy "planner_plans_all_own" on public.planner_plans
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
