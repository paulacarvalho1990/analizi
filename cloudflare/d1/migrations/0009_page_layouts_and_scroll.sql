-- Criação de tabelas para Heatmap e Wireframe Econômico

create table if not exists page_layouts (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  page_path text not null,
  device_type text not null, -- 'desktop' ou 'mobile'
  viewport_width integer not null,
  viewport_height integer not null,
  page_height integer not null,
  layout_json text not null, -- Array de blocos estruturais [{ type, top, left, width, height, label }]
  updated_at text not null default current_timestamp,
  primary key (tracker_site_id, page_path, device_type)
);

create index if not exists page_layouts_site_idx on page_layouts (tracker_site_id, page_path);

-- Tabela consolidada de profundidade de rolagem
create table if not exists daily_page_scroll (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  page_path text not null,
  device_type text not null,
  depth_bracket text not null, -- '25%', '50%', '75%', '100%'
  visitors integer not null default 0,
  primary key (tracker_site_id, metric_date, page_path, device_type, depth_bracket)
);

create index if not exists daily_page_scroll_site_date_idx on daily_page_scroll (tracker_site_id, metric_date desc, page_path);
