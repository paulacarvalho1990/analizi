-- Consolidados GA4 diários e mensais de dispositivos, localizações e contatos.
create table if not exists ga4_daily_devices (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, device_type, browser)
);

create index if not exists ga4_daily_devices_site_date_idx
  on ga4_daily_devices (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_devices (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, device_type, browser)
);

create index if not exists ga4_monthly_devices_site_month_idx
  on ga4_monthly_devices (supabase_site_id, month_start desc);

create table if not exists ga4_daily_locations (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  country text not null default '',
  region text not null default '',
  city text not null default '',
  sessions integer not null default 0,
  users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, country, region, city)
);

create index if not exists ga4_daily_locations_site_date_idx
  on ga4_daily_locations (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_locations (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  country text not null default '',
  region text not null default '',
  city text not null default '',
  sessions integer not null default 0,
  users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, country, region, city)
);

create index if not exists ga4_monthly_locations_site_month_idx
  on ga4_monthly_locations (supabase_site_id, month_start desc);

create table if not exists ga4_daily_contacts (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  contact_type text not null,
  page_path text not null default '/',
  contacts integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, contact_type, page_path)
);

create index if not exists ga4_daily_contacts_site_date_idx
  on ga4_daily_contacts (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_contacts (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  contact_type text not null,
  page_path text not null default '/',
  contacts integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, contact_type, page_path)
);

create index if not exists ga4_monthly_contacts_site_month_idx
  on ga4_monthly_contacts (supabase_site_id, month_start desc);
