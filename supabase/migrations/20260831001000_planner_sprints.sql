-- Backfill Planner V2 sprint lifecycle if the V1 planner migration was already applied.

alter table public.planner_plans
add column if not exists sprints jsonb not null default '{"activeSprint": null, "sprintLog": []}'::jsonb;

alter table public.planner_plans
drop constraint if exists planner_plans_sprints_object;

alter table public.planner_plans
add constraint planner_plans_sprints_object check (jsonb_typeof(sprints) = 'object');
