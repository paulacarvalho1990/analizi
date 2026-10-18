-- Base do Analizi: produto, acesso por negócio e dados resumidos do site.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'viewer');
create type public.source_kind as enum ('ga4', 'tracker');
create type public.source_status as enum ('pending', 'connected', 'error', 'disconnected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  website_url text,
  segment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  domain text not null,
  tracker_site_id text not null unique default (
    'ANLZ' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 5)) || '-A'
  ) check (tracker_site_id ~ '^ANLZ[A-Z0-9]{5}-A$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, domain)
);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  kind public.source_kind not null,
  status public.source_status not null default 'pending',
  ga4_property_id text,
  connected_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, kind)
);

-- Dados exibidos no painel. Eventos brutos do rastreador ficarão no D1 e serão agregados aqui.
create table public.daily_metrics (
  site_id uuid not null references public.sites(id) on delete cascade,
  metric_date date not null,
  visits integer not null default 0 check (visits >= 0),
  visitors integer not null default 0 check (visitors >= 0),
  new_visitors integer not null default 0 check (new_visitors >= 0),
  average_time_seconds integer not null default 0 check (average_time_seconds >= 0),
  contact_interactions integer not null default 0 check (contact_interactions >= 0),
  closing_rate numeric(5,2) check (closing_rate between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_id, metric_date)
);

create table public.daily_sources (
  site_id uuid not null references public.sites(id) on delete cascade,
  metric_date date not null,
  source text not null,
  medium text not null default '',
  campaign text not null default '',
  visits integer not null default 0 check (visits >= 0),
  primary key (site_id, metric_date, source, medium, campaign)
);

create table public.daily_pages (
  site_id uuid not null references public.sites(id) on delete cascade,
  metric_date date not null,
  page_path text not null,
  page_title text,
  visits integer not null default 0 check (visits >= 0),
  average_time_seconds integer not null default 0 check (average_time_seconds >= 0),
  exits integer not null default 0 check (exits >= 0),
  primary key (site_id, metric_date, page_path)
);

create table public.monthly_event_usage (
  site_id uuid not null references public.sites(id) on delete cascade,
  usage_month date not null check (usage_month = date_trunc('month', usage_month)::date),
  event_count bigint not null default 0 check (event_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (site_id, usage_month)
);

create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  week_start date not null,
  week_end date not null check (week_end >= week_start),
  report_payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (site_id, week_start, week_end)
);

create index daily_metrics_site_date_idx on public.daily_metrics (site_id, metric_date desc);
create index daily_sources_site_date_idx on public.daily_sources (site_id, metric_date desc);
create index daily_pages_site_date_idx on public.daily_pages (site_id, metric_date desc);
create index sites_tracker_site_id_idx on public.sites (tracker_site_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create or replace function public.add_business_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.business_members (business_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger businesses_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger sites_updated_at before update on public.sites for each row execute function public.set_updated_at();
create trigger sources_updated_at before update on public.data_sources for each row execute function public.set_updated_at();
create trigger metrics_updated_at before update on public.daily_metrics for each row execute function public.set_updated_at();
create trigger new_user_profile after insert on auth.users for each row execute procedure public.handle_new_user();
create trigger new_business_owner after insert on public.businesses for each row execute procedure public.add_business_owner();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.sites enable row level security;
alter table public.data_sources enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.daily_sources enable row level security;
alter table public.daily_pages enable row level security;
alter table public.monthly_event_usage enable row level security;
alter table public.weekly_reports enable row level security;

create policy "profiles can read their own record" on public.profiles for select using (id = auth.uid());
create policy "profiles can update their own record" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "members can read businesses" on public.businesses for select using (public.is_business_member(id));
create policy "signed in users can create businesses" on public.businesses for insert to authenticated with check (owner_id = auth.uid());
create policy "owners can update businesses" on public.businesses for update using (public.is_business_owner(id)) with check (public.is_business_owner(id));

create policy "members can read memberships" on public.business_members for select using (public.is_business_member(business_id));
create policy "owners can add memberships" on public.business_members for insert with check (public.is_business_owner(business_id));
create policy "owners can update memberships" on public.business_members for update using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy "owners can remove memberships" on public.business_members for delete using (public.is_business_owner(business_id));

create policy "members can read sites" on public.sites for select using (public.is_business_member(business_id));
create policy "owners can manage sites" on public.sites for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));

create policy "members can read sources" on public.data_sources for select using (exists (select 1 from public.sites where sites.id = site_id and public.is_business_member(sites.business_id)));
create policy "owners can manage sources" on public.data_sources for all using (exists (select 1 from public.sites where sites.id = site_id and public.is_business_owner(sites.business_id))) with check (exists (select 1 from public.sites where sites.id = site_id and public.is_business_owner(sites.business_id)));

create policy "members can read daily metrics" on public.daily_metrics for select using (exists (select 1 from public.sites where sites.id = site_id and public.is_business_member(sites.business_id)));
create policy "members can read daily sources" on public.daily_sources for select using (exists (select 1 from public.sites where sites.id = site_id and public.is_business_member(sites.business_id)));
create policy "members can read daily pages" on public.daily_pages for select using (exists (select 1 from public.sites where sites.id = site_id and public.is_business_member(sites.business_id)));
create policy "members can read event usage" on public.monthly_event_usage for select using (exists (select 1 from public.sites where sites.id = site_id and public.is_business_member(sites.business_id)));
create policy "members can read weekly reports" on public.weekly_reports for select using (exists (select 1 from public.sites where sites.id = site_id and public.is_business_member(sites.business_id)));

revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.is_business_owner(uuid) from public;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.is_business_owner(uuid) to authenticated;
