-- Mantém snapshots imutáveis do layout para comparar mudanças visuais da mesma URL.
create table if not exists page_layout_versions (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  page_path text not null,
  device_type text not null,
  layout_hash text not null,
  viewport_width integer not null,
  viewport_height integer not null,
  page_height integer not null,
  layout_json text not null,
  first_seen_at text not null default current_timestamp,
  last_seen_at text not null default current_timestamp,
  sample_count integer not null default 1,
  primary key (tracker_site_id, page_path, device_type, layout_hash)
);

create index if not exists page_layout_versions_period_idx
  on page_layout_versions (tracker_site_id, page_path, device_type, last_seen_at desc);
