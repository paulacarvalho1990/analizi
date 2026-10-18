alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, new.phone);
  return new;
end;
$$;
