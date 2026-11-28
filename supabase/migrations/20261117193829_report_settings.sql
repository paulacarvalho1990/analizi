create table if not exists public.report_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  report_kind text not null check (report_kind in ('geral', 'contatos', 'visitas', 'regiao')),
  next_report_kind text check (next_report_kind in ('geral', 'contatos', 'visitas', 'regiao')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, site_id)
);

create index if not exists report_settings_site_idx on public.report_settings (site_id);

create trigger report_settings_set_updated_at
  before update on public.report_settings
  for each row execute function public.set_updated_at();

alter table public.report_settings enable row level security;

create policy "users read own report settings"
  on public.report_settings for select
  using (user_id = auth.uid());

create policy "users create own report settings"
  on public.report_settings for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.sites s where s.id = site_id and public.is_business_member(s.business_id))
  );

create policy "users update own report settings"
  on public.report_settings for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.sites s where s.id = site_id and public.is_business_member(s.business_id))
  );

create or replace function public.promote_next_report_kinds()
returns void language sql security definer set search_path = public as $$
  update public.report_settings
     set report_kind = next_report_kind, next_report_kind = null
   where next_report_kind is not null;
$$;
revoke all on function public.promote_next_report_kinds() from public, anon, authenticated;
grant execute on function public.promote_next_report_kinds() to service_role;
