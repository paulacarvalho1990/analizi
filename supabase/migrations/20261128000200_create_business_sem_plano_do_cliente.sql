-- =============================================================================
-- Migration: plano e assinatura só podem ser definidos pelo servidor (card #99)
-- ATENÇÃO: publicar o front antes de aplicar (o front antigo envia p_plan etc.).
-- =============================================================================

-- 1. A função deixa de receber plano, status e vencimento do navegador.
drop function if exists public.create_business_for_current_user(uuid, text, text, text, text, text, text, text, text, timestamptz);

create or replace function public.create_business_for_current_user(
  p_business_id uuid,
  p_name text,
  p_slug text,
  p_website_url text default null,
  p_segment text default null,
  p_subsegment text default null,
  p_segment_detail text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_profile public.profiles;
  created_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'Sua sessão expirou. Faça login novamente.';
  end if;

  select * into owner_profile from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Perfil não encontrado. Saia e entre novamente.';
  end if;

  insert into public.businesses (
    id, owner_id, name, slug, website_url, segment, subsegment,
    segment_detail, plan, subscription_status, subscription_expires_at
  )
  values (
    p_business_id, auth.uid(), p_name, p_slug, p_website_url, p_segment,
    p_subsegment, p_segment_detail, owner_profile.plan,
    owner_profile.subscription_status, owner_profile.subscription_expires_at
  )
  returning * into created_business;

  return created_business;
end;
$$;

revoke all on function public.create_business_for_current_user(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_business_for_current_user(uuid, text, text, text, text, text, text) to authenticated;

-- 2. Escrita direta: só as colunas que o app edita. O RLS limita linhas, não colunas,
--    e revogar por coluna não desfaz um grant de tabela; por isso revoga e concede de novo.
--    Perfis nascem pelo trigger handle_new_user; negócios, pela função acima.
revoke insert, update, delete, truncate on public.profiles, public.businesses from anon, authenticated;
grant update (full_name, email, phone) on public.profiles to authenticated;
grant update (name, website_url, segment, subsegment, segment_detail) on public.businesses to authenticated;

notify pgrst, 'reload schema';
