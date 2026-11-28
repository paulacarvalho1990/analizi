-- Registro imutável das aceitações obrigatórias no primeiro acesso.
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_key text not null check (consent_key in ('service_terms', 'site_data_processing')),
  version text not null,
  accepted_at timestamptz not null default now(),
  source text not null default 'web',
  terms_snapshot jsonb not null default '{}'::jsonb,
  unique (user_id, consent_key, version)
);

create index user_consents_user_id_idx on public.user_consents (user_id, accepted_at desc);

alter table public.user_consents enable row level security;

create policy "users can read their own consents"
  on public.user_consents for select
  using (user_id = auth.uid());

create policy "users can record their own consents"
  on public.user_consents for insert to authenticated
  with check (user_id = auth.uid());

comment on table public.user_consents is 'Registro de aceite por usuário, tipo e versão do termo.';
