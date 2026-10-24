-- Tabela para guardar os cruzamentos consolidados diários de origem por página e detalhes de cliques/contatos
create table if not exists daily_source_pages (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  source text not null,
  page_path text not null,
  page_views integer not null default 0,
  users integer not null default 0,
  primary key (tracker_site_id, metric_date, source, page_path)
);

create table if not exists daily_button_clicks (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  page_path text not null,
  button_label text not null default '',
  button_id text not null default '',
  destination text not null default '',
  contact_intent text not null default 'geral',
  is_contact_lead integer not null default 0,
  clicks integer not null default 0,
  sessions integer not null default 0,
  primary key (tracker_site_id, metric_date, page_path, button_label, button_id, destination, contact_intent, is_contact_lead)
);

create index if not exists daily_source_pages_site_date_idx on daily_source_pages (tracker_site_id, metric_date desc);
create index if not exists daily_button_clicks_site_date_idx on daily_button_clicks (tracker_site_id, metric_date desc);
