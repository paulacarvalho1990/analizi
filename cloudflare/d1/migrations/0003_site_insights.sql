-- Armazena os relatórios e insights de inteligência do Analizi (IZI INTELLIGENCE)
create table if not exists site_insights (
  id text primary key,
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  week_cycle text not null, -- formato: YYYY-Www (ex: 2026-W43)
  temporal_scope text not null default 'semanal', -- semanal, mensal ou anual
  insights_json text not null,
  model text not null default 'IZI INTELLIGENCE',
  metadata_json text not null default '{}',
  created_at text not null default current_timestamp,
  unique (tracker_site_id, week_cycle)
);

create index if not exists site_insights_site_cycle_idx on site_insights (tracker_site_id, week_cycle desc);
