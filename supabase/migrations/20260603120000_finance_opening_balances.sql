create table if not exists public.finance_opening_balances (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  amount numeric(12, 2) not null,
  effective_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists finance_opening_balances_set_updated_at on public.finance_opening_balances;
create trigger finance_opening_balances_set_updated_at before update on public.finance_opening_balances
for each row execute function public.set_updated_at();

alter table public.finance_opening_balances enable row level security;

create policy "finance_opening_balances_all_own" on public.finance_opening_balances
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
