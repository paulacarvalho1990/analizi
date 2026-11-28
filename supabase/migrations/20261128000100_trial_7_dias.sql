-- =============================================================================
-- Migration: teste grátis de 7 dias (card #53)
-- Novos usuários e negócios começam em 'trialing' com vencimento em 7 dias.
-- Linhas existentes não são alteradas (quem já tem 30 dias mantém; admins seguem ativos).
-- =============================================================================

alter table public.profiles
  alter column subscription_status set default 'trialing',
  alter column subscription_expires_at set default (now() + interval '7 days');

alter table public.businesses
  alter column subscription_status set default 'trialing',
  alter column subscription_expires_at set default (now() + interval '7 days');

-- Negócio novo herda plano e assinatura do dono; sem dados do dono, começa em teste de 7 dias.
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
    new.subscription_status := coalesce(v_user_status, 'trialing');
    new.subscription_expires_at := coalesce(v_user_expires, now() + interval '7 days');
  end if;
  return new;
end;
$$;
