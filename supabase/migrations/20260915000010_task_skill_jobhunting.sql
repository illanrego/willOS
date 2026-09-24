-- Job hunting becomes a first-class Gamify skill.
-- The daily that drives it is added from the Dailies window; the check
-- constraint has to learn the new code first.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'tasks_skill_code_valid'
  ) then
    alter table public.tasks drop constraint tasks_skill_code_valid;
  end if;
end
$$;

alter table public.tasks
  add constraint tasks_skill_code_valid
  check (
    skill_code is null
    or skill_code in ('coding', 'fitness', 'content', 'standup', 'meditation', 'jobhunting')
  );
