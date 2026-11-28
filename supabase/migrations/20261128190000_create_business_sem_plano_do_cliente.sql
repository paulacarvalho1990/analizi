-- =============================================================================
-- Migration: plano e assinatura do negócio vêm do perfil do dono (card #99, parte A)
-- ATENÇÃO: publicar o front antes de aplicar (o front antigo envia p_plan etc.).
-- =============================================================================

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

-- Só os privilégios que o app usa (remove também trigger, references e maintain).
revoke all on public.profiles, public.businesses from anon, authenticated;
grant select on public.profiles, public.businesses to anon, authenticated;
grant update (full_name, email, phone) on public.profiles to authenticated;
grant update (name, website_url, segment, subsegment, segment_detail) on public.businesses to authenticated;

notify pgrst, 'reload schema';
