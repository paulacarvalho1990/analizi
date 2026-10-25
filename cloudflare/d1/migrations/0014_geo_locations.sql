-- Adiciona captura geográfica de País, Estado (Região/UF) e Cidade via Cloudflare Edge (request.cf)
alter table events add column country text;
alter table events add column region text;
alter table events add column city text;

create index if not exists events_site_location_idx on events (tracker_site_id, country, region, city);

create table if not exists daily_locations (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  country text not null default '',
  region text not null default '',
  city text not null default '',
  page_views integer not null default 0,
  users integer not null default 0,
  sessions integer not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, metric_date, country, region, city)
);

create index if not exists daily_locations_site_date_idx on daily_locations (tracker_site_id, metric_date desc);
