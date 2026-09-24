-- The planner is title + dates + one note now.
-- Relax the constraints that only existed to serve the lanes and the summary,
-- so a plan can be saved with just those fields. Nothing is dropped: the lane,
-- milestone, weekly-block and sprint columns stay in the table, dormant.

alter table public.planner_plans
  alter column primary_lane drop not null,
  alter column hedge_lane drop not null,
  alter column floor_lane drop not null,
  drop constraint if exists planner_plans_primary_lane_not_blank,
  drop constraint if exists planner_plans_hedge_lane_not_blank,
  drop constraint if exists planner_plans_floor_lane_not_blank,
  drop constraint if exists planner_plans_summary_not_blank;
