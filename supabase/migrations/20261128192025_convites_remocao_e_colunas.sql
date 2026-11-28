-- =============================================================================
-- Migration: remoção de membro cancela o convite; validade só pelo servidor (Refs #30)
-- =============================================================================

create or replace function public.cancel_invitation_on_member_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.business_invitations i
  using auth.users u
  where u.id = old.user_id
    and i.business_id = old.business_id
    and i.email = lower(trim(u.email));
  return old;
end;
$$;

revoke all on function public.cancel_invitation_on_member_removal() from public, anon, authenticated;

drop trigger if exists business_members_cancel_invitation on public.business_members;
create trigger business_members_cancel_invitation
  after delete on public.business_members
  for each row execute function public.cancel_invitation_on_member_removal();

-- expires_at e token são definidos pelo banco.
revoke all on public.business_invitations from anon, authenticated;
grant select, delete on public.business_invitations to authenticated;
grant insert (business_id, email, role, invited_by, status),
      update (business_id, email, role, invited_by, status)
  on public.business_invitations to authenticated;
