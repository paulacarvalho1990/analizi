-- D1 é a fonte única dos eventos e dos totais que aparecem no painel Analizi.
create table if not exists tracker_sites (
  tracker_site_id text primary key,
  supabase_site_id text not null,
  business_id text not null,
  plan text not null default 'essential',
  is_active integer not null default 1,
  created_at text not null default current_timestamp
);

create table if not exists events (
  id text primary key,
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  occurred_at text not null,
  received_at text not null default current_timestamp,
  event_name text not null,
  visitor_id text not null,
  session_id text not null,
  session_number integer,
  page_path text,
  page_title text,
  page_url text,
  page_hostname text,
  referrer_host text,
  referrer_url text,
  source text,
  medium text not null default '',
  campaign text not null default '',
  device_type text,
  browser text,
  operating_system text,
  language text,
  engagement_time_ms integer,
  is_conversion integer not null default 0,
  metadata_json text not null default '{}'
);

create index if not exists events_site_time_idx on events (tracker_site_id, occurred_at desc);
create index if not exists events_site_visitor_idx on events (tracker_site_id, visitor_id, occurred_at desc);
create index if not exists events_site_session_idx on events (tracker_site_id, session_id, occurred_at asc);
create index if not exists events_site_page_idx on events (tracker_site_id, page_path);
create index if not exists events_site_source_idx on events (tracker_site_id, source, medium, campaign);

create table if not exists daily_metrics (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  visits integer not null default 0,
  visitors integer not null default 0,
  new_visitors integer not null default 0,
  average_time_seconds integer not null default 0,
  contact_interactions integer not null default 0,
  closing_rate real,
  primary key (tracker_site_id, metric_date)
);

create table if not exists daily_sources (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  source text not null,
  medium text not null default '',
  campaign text not null default '',
  visits integer not null default 0,
  primary key (tracker_site_id, metric_date, source, medium, campaign)
);

create table if not exists daily_pages (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  page_path text not null,
  page_title text,
  visits integer not null default 0,
  average_time_seconds integer not null default 0,
  exits integer not null default 0,
  primary key (tracker_site_id, metric_date, page_path)
);

create table if not exists monthly_event_usage (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  usage_month text not null,
  event_count integer not null default 0,
  updated_at text not null default current_timestamp,
  primary key (tracker_site_id, usage_month)
);
