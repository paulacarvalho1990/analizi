-- =============================================================================
-- Migration: Planos, Assinaturas, Limites de Sites e Gestão de Equipe ("Meu Site")
-- =============================================================================

-- 1. Adiciona campos de plano e assinatura em profiles
alter table public.profiles
  add column if not exists plan text not null default 'essential'
    check (plan in ('essential', 'growth', 'admin')),
  add column if not exists subscription_status text not null default 'active'
    check (subscription_status in ('active', 'trialing', 'past_due', 'canceled')),
  add column if not exists subscription_expires_at timestamptz not null default (now() + interval '30 days');

-- 2. Adiciona campos de plano e assinatura em businesses
alter table public.businesses
  add column if not exists plan text not null default 'essential'
    check (plan in ('essential', 'growth', 'admin')),
  add column if not exists subscription_status text not null default 'active'
    check (subscription_status in ('active', 'trialing', 'past_due', 'canceled')),
  add column if not exists subscription_expires_at timestamptz not null default (now() + interval '30 days');

-- 3. Permite que membros de um mesmo negócio possam ver o nome e e-mail dos colegas de equipe em profiles
drop policy if exists "members can read profiles of business peers" on public.profiles;
create policy "members can read profiles of business peers"
  on public.profiles
  for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.business_members m1
      join public.business_members m2 on m1.business_id = m2.business_id
      where m1.user_id = auth.uid()
        and m2.user_id = public.profiles.id
    )
  );

-- 4. Função auxiliar para retornar o limite de sites permitido pelo plano
create or replace function public.plan_site_limit(p_plan text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when p_plan = 'admin' then 999999
    when p_plan = 'growth' then 2
    else 1
  end;
$$;

-- 5. Ao criar um novo negócio, herda automaticamente o plano do usuário proprietário
create or replace function public.sync_business_plan_from_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_plan text;
  v_user_status text;
  v_user_expires timestamptz;
begin
  select plan, subscription_status, subscription_expires_at
  into v_user_plan, v_user_status, v_user_expires
  from public.profiles
  where id = new.owner_id;

  if v_user_plan is not null then
    new.plan := v_user_plan;
    new.subscription_status := coalesce(v_user_status, 'active');
    new.subscription_expires_at := coalesce(v_user_expires, now() + interval '30 days');
  end if;
  return new;
end;
$$;

drop trigger if exists sync_business_plan_before_insert on public.businesses;
create trigger sync_business_plan_before_insert
  before insert on public.businesses
  for each row execute function public.sync_business_plan_from_owner();

-- 6. Quando um usuário faz login ou é criado, aceita automaticamente convites pendentes para o e-mail dele
create or replace function public.accept_pending_invitations_for_user(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  if p_email is null or trim(p_email) = '' then
    return;
  end if;

  for inv in
    select id, business_id, role
    from public.business_invitations
    where lower(email) = lower(trim(p_email))
      and status = 'pending'
  loop
    insert into public.business_members (business_id, user_id, role)
    values (inv.business_id, p_user_id, inv.role)
    on conflict (business_id, user_id) do update
      set role = excluded.role;

    update public.business_invitations
    set status = 'accepted'
    where id = inv.id;
  end loop;
end;
$$;

revoke all on function public.accept_pending_invitations_for_user(uuid, text) from public;
grant execute on function public.accept_pending_invitations_for_user(uuid, text) to authenticated;

-- 7. Atualiza os usuários existentes Paula e Junior para o Plano Admin com todas as funções liberadas
update public.profiles
set
  plan = 'admin',
  subscription_status = 'active',
  subscription_expires_at = '2099-12-31T23:59:59Z'::timestamptz
where
  id in (
    'd0ff1258-aa98-4c0e-bf2b-a9b311c4df18',
    'f6f8bdcc-9cfe-40ae-9dd1-3d4f5502e387'
  )
  or lower(email) in ('paula53160@gmail.com', 'juninho1523@gmail.com')
  or lower(full_name) like '%paula%'
  or lower(full_name) like '%junior%';

update public.businesses
set
  plan = 'admin',
  subscription_status = 'active',
  subscription_expires_at = '2099-12-31T23:59:59Z'::timestamptz
where
  owner_id in (
    select id from public.profiles where plan = 'admin'
  )
  or id in (
    '8383caf2-aade-4411-985d-845f9546e031',
    'ee311c3b-3e89-4a94-8b29-6e8c36a06f28'
  );
