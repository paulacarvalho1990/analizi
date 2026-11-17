-- Relatórios semanais gerados toda segunda (semana fechada seg–dom).
-- Um registro por site, semana e tipo de relatório; os insights de IA ficam junto.
create table if not exists weekly_site_reports (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  week_start text not null,
  week_end text not null,
  report_kind text not null check (report_kind in ('geral', 'contatos', 'visitas', 'regiao')),
  data_json text not null default '{}',
  insights_json text not null default '[]',
  model text,
  created_at text not null,
  primary key (tracker_site_id, week_start, report_kind)
);

create index if not exists weekly_site_reports_site_week_idx on weekly_site_reports (tracker_site_id, week_start desc);
