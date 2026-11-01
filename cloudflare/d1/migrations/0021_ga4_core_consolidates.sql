-- Consolidados GA4 diários e mensais de métricas, aquisição e páginas.
create table if not exists ga4_daily_metrics (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, metric_date)
);

create index if not exists ga4_daily_metrics_site_date_idx
  on ga4_daily_metrics (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_metrics (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, month_start)
);

create index if not exists ga4_monthly_metrics_site_month_idx
  on ga4_monthly_metrics (supabase_site_id, month_start desc);

create table if not exists ga4_daily_source_medium_results (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  source text not null default 'Direto',
  medium text not null default 'direto',
  campaign text not null default '',
  sessions integer not null default 0,
  page_views integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  key_events integer not null default 0,
  general_clicks integer not null default 0,
  contact_clicks integer not null default 0,
  whatsapp_clicks integer not null default 0,
  sign_ups integer not null default 0,
  logins integer not null default 0,
  conversions integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, source, medium, campaign)
);

create index if not exists ga4_daily_sm_site_date_idx
  on ga4_daily_source_medium_results (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_source_medium_results (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  source text not null default 'Direto',
  medium text not null default 'direto',
  campaign text not null default '',
  sessions integer not null default 0,
  page_views integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  key_events integer not null default 0,
  general_clicks integer not null default 0,
  contact_clicks integer not null default 0,
  whatsapp_clicks integer not null default 0,
  sign_ups integer not null default 0,
  logins integer not null default 0,
  conversions integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, source, medium, campaign)
);

create index if not exists ga4_monthly_sm_site_month_idx
  on ga4_monthly_source_medium_results (supabase_site_id, month_start desc);

create table if not exists ga4_daily_pages (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  page_path text not null default '/',
  page_views integer not null default 0,
  users integer not null default 0,
  sessions integer not null default 0,
  key_events integer not null default 0,
  bounce_rate real,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, metric_date, page_path)
);

create index if not exists ga4_daily_pages_site_date_idx
  on ga4_daily_pages (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_pages (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  page_path text not null default '/',
  page_views integer not null default 0,
  users integer not null default 0,
  sessions integer not null default 0,
  key_events integer not null default 0,
  bounce_rate real,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, month_start, page_path)
);

create index if not exists ga4_monthly_pages_site_month_idx
  on ga4_monthly_pages (supabase_site_id, month_start desc);

create table if not exists ga4_daily_source_pages (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  source text not null default 'Direto',
  landing_page text not null default '/',
  sessions integer not null default 0,
  users integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, source, landing_page)
);

create index if not exists ga4_daily_source_pages_site_date_idx
  on ga4_daily_source_pages (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_source_pages (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  source text not null default 'Direto',
  landing_page text not null default '/',
  sessions integer not null default 0,
  users integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, source, landing_page)
);

create index if not exists ga4_monthly_source_pages_site_month_idx
  on ga4_monthly_source_pages (supabase_site_id, month_start desc);
