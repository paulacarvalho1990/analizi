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

-- 7. Em produção, esta migration também promoveu as contas internas ao plano
-- admin. Esse passo usava e-mails e ids reais e foi omitido do repositório;
-- defina o plano admin manualmente em ambientes novos.
