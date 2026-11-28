-- =============================================================================
-- Migration: aceite de convite usa a sessão e o e-mail confirmado do login (Refs #30)
-- Os parâmetros continuam na assinatura só por compatibilidade com o front e são ignorados.
-- =============================================================================

create or replace function public.accept_pending_invitations_for_user(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  inv record;
begin
  if v_user_id is null then
    return;
  end if;

  select lower(trim(email)) into v_email
  from auth.users
  where id = v_user_id and email_confirmed_at is not null;

  if v_email is null or v_email = '' then
    return;
  end if;

  for inv in
    select id, business_id, role
    from public.business_invitations
    where email = v_email
      and status = 'pending'
      and expires_at > now()
    for update
  loop
    -- Quem já é membro mantém o papel atual.
    insert into public.business_members (business_id, user_id, role)
    values (inv.business_id, v_user_id, inv.role)
    on conflict (business_id, user_id) do nothing;

    update public.business_invitations set status = 'accepted' where id = inv.id;
  end loop;
end;
$$;

revoke all on function public.accept_pending_invitations_for_user(uuid, text) from public, anon;
grant execute on function public.accept_pending_invitations_for_user(uuid, text) to authenticated;

-- Reenviar o convite (status volta a 'pending') renova a validade; mudar só o papel, não.
create or replace function public.renew_invitation_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'pending' then
    new.expires_at := now() + interval '7 days';
  end if;
  return new;
end;
$$;

revoke all on function public.renew_invitation_expiry() from public, anon, authenticated;

drop trigger if exists business_invitations_renew_expiry on public.business_invitations;
create trigger business_invitations_renew_expiry
  before update of status on public.business_invitations
  for each row execute function public.renew_invitation_expiry();
