-- Cria negócios usando o proprietário da sessão autenticada.
-- Centralizar a operação evita divergências na avaliação de RLS entre clientes
-- e garante que nenhum usuário consiga definir o proprietário de outro negócio.
create or replace function public.create_business_for_current_user(
  p_business_id uuid,
  p_name text,
  p_slug text,
  p_website_url text default null,
  p_segment text default null,
  p_subsegment text default null,
  p_segment_detail text default null,
  p_plan text default null,
  p_subscription_status text default null,
  p_subscription_expires_at timestamptz default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  created_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'Sua sessão expirou. Faça login novamente.';
  end if;

  insert into public.businesses (
    id,
    owner_id,
    name,
    slug,
    website_url,
    segment,
    subsegment,
    segment_detail,
    plan,
    subscription_status,
    subscription_expires_at
  )
  values (
    p_business_id,
    auth.uid(),
    p_name,
    p_slug,
    p_website_url,
    p_segment,
    p_subsegment,
    p_segment_detail,
    p_plan,
    p_subscription_status,
    p_subscription_expires_at
  )
  returning * into created_business;

  return created_business;
end;
$$;

revoke all on function public.create_business_for_current_user(uuid, text, text, text, text, text, text, text, text, timestamptz) from public;
grant execute on function public.create_business_for_current_user(uuid, text, text, text, text, text, text, text, text, timestamptz) to authenticated;
