-- Consolidados mensais do rastreador para o histórico de 6 a 27 meses.
create table if not exists monthly_metrics (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  conversions integer not null default 0,
  whatsapp_contacts integer not null default 0,
  sign_ups integer not null default 0,
  form_submits integer not null default 0,
  logins integer not null default 0,
  average_engagement_seconds real not null default 0,
  exit_rate real,
  primary key (tracker_site_id, month_start)
);

create table if not exists monthly_sources (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  source text not null,
  medium text not null default '',
  campaign text not null default '',
  users integer not null default 0,
  new_users integer not null default 0,
  sessions integer not null default 0,
  page_views integer not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, month_start, source, medium, campaign)
);

create table if not exists monthly_pages (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  page_path text not null,
  page_title text,
  page_views integer not null default 0,
  users integer not null default 0,
  entrances integer not null default 0,
  exits integer not null default 0,
  exit_rate real,
  average_engagement_seconds real not null default 0,
  average_load_time_ms real not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, month_start, page_path)
);

create table if not exists monthly_source_pages (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  source text not null,
  page_path text not null,
  page_views integer not null default 0,
  users integer not null default 0,
  primary key (tracker_site_id, month_start, source, page_path)
);

create table if not exists monthly_button_clicks (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  page_path text not null,
  button_label text not null default '',
  button_id text not null default '',
  destination text not null default '',
  contact_intent text not null default 'geral',
  is_contact_lead integer not null default 0,
  clicks integer not null default 0,
  sessions integer not null default 0,
  primary key (tracker_site_id, month_start, page_path, button_label, button_id, destination, contact_intent, is_contact_lead)
);

create table if not exists monthly_contacts (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  contact_type text not null,
  page_path text not null,
  contacts integer not null default 0,
  primary key (tracker_site_id, month_start, contact_type, page_path)
);

create table if not exists monthly_locations (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  country text not null default '',
  region text not null default '',
  city text not null default '',
  page_views integer not null default 0,
  users integer not null default 0,
  sessions integer not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, month_start, country, region, city)
);

create table if not exists monthly_devices (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, month_start, device_type, browser)
);

create table if not exists monthly_source_medium_results (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  source text not null default 'Direto',
  medium text not null default 'direto',
  campaign text not null default '',
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  page_path text not null default '/',
  sessions integer not null default 0,
  page_views integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  general_clicks integer not null default 0,
  contact_clicks integer not null default 0,
  whatsapp_clicks integer not null default 0,
  sign_ups integer not null default 0,
  form_submits integer not null default 0,
  logins integer not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, month_start, source, medium, campaign, device_type, browser, page_path)
);

create table if not exists monthly_conversion_events (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  source text not null default 'Direto',
  medium text not null default 'direto',
  campaign text not null default '',
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  page_path text not null default '/',
  conversion_type text not null,
  conversion_name text not null default '',
  conversion_stage text not null default 'confirmada',
  conversions integer not null default 0,
  sessions integer not null default 0,
  primary key (tracker_site_id, month_start, source, medium, campaign, device_type, browser, page_path, conversion_type, conversion_name, conversion_stage)
);

create table if not exists monthly_page_scroll (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  month_start text not null,
  page_path text not null,
  device_type text not null,
  depth_bracket text not null,
  visitors integer not null default 0,
  primary key (tracker_site_id, month_start, page_path, device_type, depth_bracket)
);

create index if not exists monthly_metrics_site_month_idx on monthly_metrics (tracker_site_id, month_start desc);
create index if not exists monthly_sources_site_month_idx on monthly_sources (tracker_site_id, month_start desc);
create index if not exists monthly_pages_site_month_idx on monthly_pages (tracker_site_id, month_start desc);
create index if not exists monthly_source_pages_site_month_idx on monthly_source_pages (tracker_site_id, month_start desc);
create index if not exists monthly_button_clicks_site_month_idx on monthly_button_clicks (tracker_site_id, month_start desc);
create index if not exists monthly_contacts_site_month_idx on monthly_contacts (tracker_site_id, month_start desc);
create index if not exists monthly_locations_site_month_idx on monthly_locations (tracker_site_id, month_start desc);
create index if not exists monthly_devices_site_month_idx on monthly_devices (tracker_site_id, month_start desc);
create index if not exists monthly_sm_results_site_month_idx on monthly_source_medium_results (tracker_site_id, month_start desc);
create index if not exists monthly_conversion_events_site_month_idx on monthly_conversion_events (tracker_site_id, month_start desc);
create index if not exists monthly_page_scroll_site_month_idx on monthly_page_scroll (tracker_site_id, month_start desc);
