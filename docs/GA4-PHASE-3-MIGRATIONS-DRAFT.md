# Fase 3 — Rascunho de migrations do GA4

## Status

Rascunho para revisão. Este arquivo não é aplicado pelo Wrangler e não foi colocado em `cloudflare/d1/migrations`.

## Decisão de modelagem proposta

Usar tabelas consolidadas próprias do GA4, sem misturar os dados com as tabelas `daily_*` do rastreador.

Cada tabela terá:

- `supabase_site_id`;
- `property_id`;
- `period_type`: `day` ou `month`;
- `period_start`: dia exato para diário ou primeiro dia do mês para mensal;
- dimensões específicas da família;
- métricas agregadas.

Essa abordagem mantém diário e mensal no mesmo contrato físico, evita duplicar dez conjuntos de tabelas e permite aplicar retenção por `period_type`.

## Migration 0020 — Controle de sincronização

```sql
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
  status text not null check (status in ('pending', 'success', 'failed')),
  attempts integer not null default 0,
  last_run_id text,
  last_success_at text,
  last_error text,
  updated_at text not null default current_timestamp,
  primary key (supabase_site_id, property_id, period_type, period_start)
);

create index if not exists ga4_sync_periods_pending_idx
  on ga4_sync_periods (status, updated_at);
```

### Finalidade

- `ga4_sync_runs`: auditoria de cada execução do cron ou backfill.
- `ga4_sync_periods`: controle idempotente por site, propriedade e período.
- Permite reprocessar D-1, D-2 e D-3 sem perder o histórico de tentativas.

## Migration 0021 — Consolidados principais

```sql
create table if not exists ga4_metrics (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start)
);

create index if not exists ga4_metrics_period_idx
  on ga4_metrics (supabase_site_id, period_type, period_start desc);

create table if not exists ga4_sources (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  source text not null default 'Direto',
  medium text not null default 'direto',
  campaign text not null default '',
  sessions integer not null default 0,
  page_views integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  key_events integer not null default 0,
  general_clicks integer not null default 0,
  contact_clicks integer not null default 0,
  whatsapp_clicks integer not null default 0,
  sign_ups integer not null default 0,
  logins integer not null default 0,
  conversions integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, source, medium, campaign)
);

create index if not exists ga4_sources_period_idx
  on ga4_sources (supabase_site_id, period_type, period_start desc);

create table if not exists ga4_pages (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  page_path text not null default '/',
  page_views integer not null default 0,
  users integer not null default 0,
  sessions integer not null default 0,
  key_events integer not null default 0,
  bounce_rate real,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, page_path)
);

create index if not exists ga4_pages_period_idx
  on ga4_pages (supabase_site_id, period_type, period_start desc);

create table if not exists ga4_source_pages (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  source text not null default 'Direto',
  landing_page text not null default '/',
  sessions integer not null default 0,
  users integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, source, landing_page)
);

create index if not exists ga4_source_pages_period_idx
  on ga4_source_pages (supabase_site_id, period_type, period_start desc);
```

## Migration 0022 — Dimensões e detalhes

```sql
create table if not exists ga4_devices (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, device_type, browser)
);

create index if not exists ga4_devices_period_idx
  on ga4_devices (supabase_site_id, period_type, period_start desc);

create table if not exists ga4_locations (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  country text not null default '',
  region text not null default '',
  city text not null default '',
  sessions integer not null default 0,
  users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, country, region, city)
);

create index if not exists ga4_locations_period_idx
  on ga4_locations (supabase_site_id, period_type, period_start desc);

create table if not exists ga4_contacts (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  contact_type text not null,
  page_path text not null default '/',
  contacts integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, contact_type, page_path)
);

create index if not exists ga4_contacts_period_idx
  on ga4_contacts (supabase_site_id, period_type, period_start desc);

create table if not exists ga4_clicks (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  page_path text not null default '/',
  label text not null default '',
  button_id text not null default '',
  destination text not null default '',
  intent text not null default 'geral',
  is_contact_lead integer not null default 0,
  clicks integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, page_path, label, button_id, destination, intent, is_contact_lead)
);

create index if not exists ga4_clicks_period_idx
  on ga4_clicks (supabase_site_id, period_type, period_start desc);

create table if not exists ga4_conversion_events (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  conversion_type text not null,
  conversion_name text not null default '',
  conversion_stage text not null default 'confirmada',
  page_path text not null default '/',
  conversions integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, conversion_type, conversion_name, conversion_stage, page_path)
);

create index if not exists ga4_conversion_events_period_idx
  on ga4_conversion_events (supabase_site_id, period_type, period_start desc);
```

## Migration 0023 — Horários de pico

```sql
create table if not exists ga4_peak_hours (
  supabase_site_id text not null,
  property_id text not null,
  period_type text not null check (period_type in ('day', 'month')),
  period_start text not null,
  day_of_week integer not null,
  hour_of_day integer not null,
  sessions integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, period_type, period_start, day_of_week, hour_of_day)
);

create index if not exists ga4_peak_hours_period_idx
  on ga4_peak_hours (supabase_site_id, period_type, period_start desc);
```

## Retenção proposta

Após o Worker gerar ou atualizar o consolidado mensal correspondente:

```sql
delete from ga4_metrics where period_type = 'day' and period_start < ?;
delete from ga4_sources where period_type = 'day' and period_start < ?;
delete from ga4_pages where period_type = 'day' and period_start < ?;
delete from ga4_source_pages where period_type = 'day' and period_start < ?;
delete from ga4_devices where period_type = 'day' and period_start < ?;
delete from ga4_locations where period_type = 'day' and period_start < ?;
delete from ga4_contacts where period_type = 'day' and period_start < ?;
delete from ga4_clicks where period_type = 'day' and period_start < ?;
delete from ga4_conversion_events where period_type = 'day' and period_start < ?;
delete from ga4_peak_hours where period_type = 'day' and period_start < ?;
```

Para mensais:

```sql
delete from ga4_metrics where period_type = 'month' and period_start < ?;
delete from ga4_sources where period_type = 'month' and period_start < ?;
delete from ga4_pages where period_type = 'month' and period_start < ?;
delete from ga4_source_pages where period_type = 'month' and period_start < ?;
delete from ga4_devices where period_type = 'month' and period_start < ?;
delete from ga4_locations where period_type = 'month' and period_start < ?;
delete from ga4_contacts where period_type = 'month' and period_start < ?;
delete from ga4_clicks where period_type = 'month' and period_start < ?;
delete from ga4_conversion_events where period_type = 'month' and period_start < ?;
delete from ga4_peak_hours where period_type = 'month' and period_start < ?;
```

Os valores de corte devem ser calculados pelo Worker, usando a timezone oficial do produto, e a limpeza só deve ocorrer depois da validação da consolidação mensal.

## Pontos para aprovação antes de aplicar

1. Aprovar o modelo unificado com `period_type` ou preferir tabelas físicas separadas para diário e mensal.
2. Confirmar se `ga4_sources` também será a fonte de `sourceMediumResults`.
3. Confirmar se `ga4_contacts` precisa manter `sessions` além de `contacts`.
4. Confirmar se o histórico de `ga4_clicks` tem valor suficiente para ser mantido por 27 meses.
5. Confirmar os limites de cardinalidade e tamanho das chaves compostas.
6. Definir se `ga4_sync_periods` deve ser preenchida antes ou depois do `upsert` dos dados.
7. Aprovar os nomes das migrations antes de mover os SQLs para `cloudflare/d1/migrations`.

## Não aplicado

Nenhum SQL deste documento foi aplicado ao D1. Depois da revisão, os blocos aprovados serão separados em migrations numeradas e validados em staging.
