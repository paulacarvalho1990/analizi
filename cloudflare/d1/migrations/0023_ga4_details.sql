-- Consolidados GA4 diários e mensais de cliques, conversões e horários de pico.
-- dimension_key é o SHA-256 das dimensões textuais calculado pelo Worker.
create table if not exists ga4_daily_clicks (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  dimension_key text not null,
  page_path text not null default '/',
  label text not null default '',
  button_id text not null default '',
  destination text not null default '',
  intent text not null default 'geral',
  is_contact_lead integer not null default 0,
  clicks integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, dimension_key)
);

create index if not exists ga4_daily_clicks_site_date_idx
  on ga4_daily_clicks (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_clicks (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  dimension_key text not null,
  page_path text not null default '/',
  label text not null default '',
  button_id text not null default '',
  destination text not null default '',
  intent text not null default 'geral',
  is_contact_lead integer not null default 0,
  clicks integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, dimension_key)
);

create index if not exists ga4_monthly_clicks_site_month_idx
  on ga4_monthly_clicks (supabase_site_id, month_start desc);

create table if not exists ga4_daily_conversion_events (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  conversion_type text not null,
  conversion_name text not null default '',
  conversion_stage text not null default 'confirmada',
  page_path text not null default '/',
  conversions integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, conversion_type, conversion_name, conversion_stage, page_path)
);

create index if not exists ga4_daily_conversion_events_site_date_idx
  on ga4_daily_conversion_events (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_conversion_events (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  conversion_type text not null,
  conversion_name text not null default '',
  conversion_stage text not null default 'confirmada',
  page_path text not null default '/',
  conversions integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, conversion_type, conversion_name, conversion_stage, page_path)
);

create index if not exists ga4_monthly_conversion_events_site_month_idx
  on ga4_monthly_conversion_events (supabase_site_id, month_start desc);

create table if not exists ga4_daily_peak_hours (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  day_of_week integer not null,
  hour_of_day integer not null,
  sessions integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, day_of_week, hour_of_day)
);

create index if not exists ga4_daily_peak_hours_site_date_idx
  on ga4_daily_peak_hours (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_peak_hours (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  day_of_week integer not null,
  hour_of_day integer not null,
  sessions integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, day_of_week, hour_of_day)
);

create index if not exists ga4_monthly_peak_hours_site_month_idx
  on ga4_monthly_peak_hours (supabase_site_id, month_start desc);
