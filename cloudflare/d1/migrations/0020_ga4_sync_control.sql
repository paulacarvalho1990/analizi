-- Controle idempotente e auditoria das sincronizações GA4.
create table if not exists ga4_sync_runs (
  id text primary key,
  supabase_site_id text not null,
  property_id text not null,
  sync_kind text not null check (sync_kind in ('daily', 'backfill', 'monthly_rollup')),
  period_start text not null,
  period_end text not null,
  status text not null check (status in ('running', 'success', 'partial', 'failed')),
  report_count integer not null default 0,
  row_count integer not null default 0,
  quota_json text,
  error_message text,
  started_at text not null default current_timestamp,
  finished_at text
);

create index if not exists ga4_sync_runs_site_started_idx
  on ga4_sync_runs (supabase_site_id, started_at desc);

create index if not exists ga4_sync_runs_status_idx
  on ga4_sync_runs (status, started_at desc);

create table if not exists ga4_sync_periods (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  status text not null check (status in ('pending', 'running', 'success', 'failed')),
  attempts integer not null default 0,
  last_run_id text,
  last_success_at text,
  last_error text,
  updated_at text not null default current_timestamp,
  primary key (supabase_site_id, property_id, period_type, period_start)
);

create index if not exists ga4_sync_periods_status_idx
  on ga4_sync_periods (status, updated_at);
