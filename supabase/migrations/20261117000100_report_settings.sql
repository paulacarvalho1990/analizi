-- Configuração do relatório semanal: qual relatório cada pessoa recebe para cada site.
-- report_kind segue os 4 relatórios do app (/relatorios/*).
create table if not exists public.report_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  report_kind text not null check (report_kind in ('geral', 'contatos', 'visitas', 'regiao')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, site_id)
);

create index if not exists report_settings_site_idx on public.report_settings (site_id);

create trigger report_settings_set_updated_at
  before update on public.report_settings
  for each row execute function public.set_updated_at();

alter table public.report_settings enable row level security;

-- Cada pessoa vê e altera só a própria configuração, e só para sites do negócio dela.
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
