-- Criação de fontes por uma função controlada: evita falhas de RLS no onboarding
-- e confirma que a conta é proprietária do negócio do site.
create or replace function public.create_data_source(p_site_id uuid, p_kind public.source_kind)
returns public.data_sources
language plpgsql
security definer
set search_path = public
as $$
declare
  created_source public.data_sources;
begin
  if not exists (
    select 1
    from public.sites s
    where s.id = p_site_id
      and public.is_business_owner(s.business_id)
  ) then
    raise exception 'Você não tem permissão para configurar esta fonte de dados.';
  end if;

  insert into public.data_sources (site_id, kind)
  values (p_site_id, p_kind)
  on conflict (site_id, kind) do update set updated_at = now()
  returning * into created_source;

  return created_source;
end;
$$;

revoke all on function public.create_data_source(uuid, public.source_kind) from public;
grant execute on function public.create_data_source(uuid, public.source_kind) to authenticated;

create table public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null check (email = lower(email)),
  role public.member_role not null default 'viewer' check (role in ('admin', 'viewer')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  unique (business_id, email)
);

alter table public.business_invitations enable row level security;

create policy "owners can read invitations" on public.business_invitations
  for select using (public.is_business_owner(business_id));
create policy "owners can create invitations" on public.business_invitations
  for insert to authenticated with check (
    public.is_business_owner(business_id) and invited_by = auth.uid()
  );
create policy "owners can update invitations" on public.business_invitations
  for update using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));
create policy "owners can remove invitations" on public.business_invitations
  for delete using (public.is_business_owner(business_id));
