-- Índices de suporte para consultas nas tabelas consolidadas diárias
create index if not exists daily_metrics_site_date_idx on daily_metrics (tracker_site_id, metric_date desc);
create index if not exists daily_sources_site_date_idx on daily_sources (tracker_site_id, metric_date desc);
create index if not exists daily_pages_site_date_idx on daily_pages (tracker_site_id, metric_date desc);
