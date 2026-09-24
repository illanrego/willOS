alter table public.tasks
  add column if not exists skill_code text,
  add column if not exists sort_order integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_skill_code_valid'
  ) then
    alter table public.tasks
      add constraint tasks_skill_code_valid
      check (
        skill_code is null
        or skill_code in ('coding', 'fitness', 'content', 'standup', 'meditation')
      );
  end if;
end
$$;

create index if not exists tasks_user_type_sort_idx
  on public.tasks (user_id, task_type, sort_order, created_at);
