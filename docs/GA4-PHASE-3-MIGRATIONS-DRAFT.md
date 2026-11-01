# Fase 3 — Rascunho de migrations do GA4

## Status

Desenho revisado e convertido em migrations reais numeradas `0020`–`0023`. A aplicação ao D1 ainda não foi executada.

## Decisões incorporadas

- Tabelas físicas separadas para diário e mensal.
- Diário mantido por 6 meses.
- Mensal mantido até 27 meses.
- Todas as famílias seguem a mesma retenção.
- `source_medium_results` será a fonte dos dados de aquisição e resultados por canal.
- `sessions` será mantido nos dados de contatos.
- Tabelas de cliques usarão `dimension_key`, um hash SHA-256 produzido pelo Worker a partir das dimensões textuais.
- `ga4_sync_periods` será marcada como `running` antes dos `upsert`s e como `success` somente depois da validação.

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
```

Fluxo de status:

```text
cria ga4_sync_runs como running
marca D-1, D-2 e D-3 como running e incrementa attempts
faz os upserts
valida contagens e períodos
marca os períodos como success
finaliza a execução como success
```

Em caso de erro, a execução e os períodos são marcados como `failed`, preservando a mensagem para retry.

## Migration 0021 — Métricas, aquisição e páginas

As tabelas diárias e mensais têm a mesma estrutura, mas são fisicamente separadas para simplificar consultas e retenção.

```sql
create table if not exists ga4_daily_metrics (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, metric_date)
);

create index if not exists ga4_daily_metrics_site_date_idx
  on ga4_daily_metrics (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_metrics (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, month_start)
);

create index if not exists ga4_monthly_metrics_site_month_idx
  on ga4_monthly_metrics (supabase_site_id, month_start desc);

create table if not exists ga4_daily_source_medium_results (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
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
  primary key (supabase_site_id, property_id, metric_date, source, medium, campaign)
);

create index if not exists ga4_daily_sm_site_date_idx
  on ga4_daily_source_medium_results (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_source_medium_results (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
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
  primary key (supabase_site_id, property_id, month_start, source, medium, campaign)
);

create index if not exists ga4_monthly_sm_site_month_idx
  on ga4_monthly_source_medium_results (supabase_site_id, month_start desc);

create table if not exists ga4_daily_pages (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  page_path text not null default '/',
  page_views integer not null default 0,
  users integer not null default 0,
  sessions integer not null default 0,
  key_events integer not null default 0,
  bounce_rate real,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, metric_date, page_path)
);

create index if not exists ga4_daily_pages_site_date_idx
  on ga4_daily_pages (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_pages (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  page_path text not null default '/',
  page_views integer not null default 0,
  users integer not null default 0,
  sessions integer not null default 0,
  key_events integer not null default 0,
  bounce_rate real,
  average_session_duration real not null default 0,
  primary key (supabase_site_id, property_id, month_start, page_path)
);

create index if not exists ga4_monthly_pages_site_month_idx
  on ga4_monthly_pages (supabase_site_id, month_start desc);

create table if not exists ga4_daily_source_pages (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  source text not null default 'Direto',
  landing_page text not null default '/',
  sessions integer not null default 0,
  users integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, source, landing_page)
);

create index if not exists ga4_daily_source_pages_site_date_idx
  on ga4_daily_source_pages (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_source_pages (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  source text not null default 'Direto',
  landing_page text not null default '/',
  sessions integer not null default 0,
  users integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, source, landing_page)
);

create index if not exists ga4_monthly_source_pages_site_month_idx
  on ga4_monthly_source_pages (supabase_site_id, month_start desc);
```

`ga4_*_source_medium_results` será a fonte de `sources`, `sourceMediumResults` e dos filtros de origem, mídia e campanha. Os totais por origem serão agregados por `source` no Worker, sem uma tabela redundante.

## Migration 0022 — Dispositivos, localização e contatos

```sql
create table if not exists ga4_daily_devices (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, device_type, browser)
);

create index if not exists ga4_daily_devices_site_date_idx
  on ga4_daily_devices (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_devices (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, device_type, browser)
);

create index if not exists ga4_monthly_devices_site_month_idx
  on ga4_monthly_devices (supabase_site_id, month_start desc);

create table if not exists ga4_daily_locations (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  country text not null default '',
  region text not null default '',
  city text not null default '',
  sessions integer not null default 0,
  users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, country, region, city)
);

create index if not exists ga4_daily_locations_site_date_idx
  on ga4_daily_locations (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_locations (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  country text not null default '',
  region text not null default '',
  city text not null default '',
  sessions integer not null default 0,
  users integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, country, region, city)
);

create index if not exists ga4_monthly_locations_site_month_idx
  on ga4_monthly_locations (supabase_site_id, month_start desc);

create table if not exists ga4_daily_contacts (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  contact_type text not null,
  page_path text not null default '/',
  contacts integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, contact_type, page_path)
);

create index if not exists ga4_daily_contacts_site_date_idx
  on ga4_daily_contacts (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_contacts (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  contact_type text not null,
  page_path text not null default '/',
  contacts integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, contact_type, page_path)
);

create index if not exists ga4_monthly_contacts_site_month_idx
  on ga4_monthly_contacts (supabase_site_id, month_start desc);
```

## Migration 0023 — Cliques, conversões e horários

```sql
create table if not exists ga4_daily_clicks (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  dimension_key text not null,
  page_path text not null default '/',
  label text not null default '',
  button_id text not null default '',
  destination text not null default '',
  intent text not null default 'geral',
  is_contact_lead integer not null default 0,
  clicks integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, dimension_key)
);

create index if not exists ga4_daily_clicks_site_date_idx
  on ga4_daily_clicks (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_clicks (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  dimension_key text not null,
  page_path text not null default '/',
  label text not null default '',
  button_id text not null default '',
  destination text not null default '',
  intent text not null default 'geral',
  is_contact_lead integer not null default 0,
  clicks integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, dimension_key)
);

create index if not exists ga4_monthly_clicks_site_month_idx
  on ga4_monthly_clicks (supabase_site_id, month_start desc);

create table if not exists ga4_daily_conversion_events (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  conversion_type text not null,
  conversion_name text not null default '',
  conversion_stage text not null default 'confirmada',
  page_path text not null default '/',
  conversions integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, conversion_type, conversion_name, conversion_stage, page_path)
);

create index if not exists ga4_daily_conversion_events_site_date_idx
  on ga4_daily_conversion_events (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_conversion_events (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  conversion_type text not null,
  conversion_name text not null default '',
  conversion_stage text not null default 'confirmada',
  page_path text not null default '/',
  conversions integer not null default 0,
  sessions integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, conversion_type, conversion_name, conversion_stage, page_path)
);

create index if not exists ga4_monthly_conversion_events_site_month_idx
  on ga4_monthly_conversion_events (supabase_site_id, month_start desc);

create table if not exists ga4_daily_peak_hours (
  supabase_site_id text not null,
  property_id text not null,
  metric_date text not null,
  day_of_week integer not null,
  hour_of_day integer not null,
  sessions integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, metric_date, day_of_week, hour_of_day)
);

create index if not exists ga4_daily_peak_hours_site_date_idx
  on ga4_daily_peak_hours (supabase_site_id, metric_date desc);

create table if not exists ga4_monthly_peak_hours (
  supabase_site_id text not null,
  property_id text not null,
  month_start text not null,
  day_of_week integer not null,
  hour_of_day integer not null,
  sessions integer not null default 0,
  page_views integer not null default 0,
  key_events integer not null default 0,
  primary key (supabase_site_id, property_id, month_start, day_of_week, hour_of_day)
);

create index if not exists ga4_monthly_peak_hours_site_month_idx
  on ga4_monthly_peak_hours (supabase_site_id, month_start desc);
```

## Retenção proposta

O Worker só remove diários depois de validar o mensal correspondente. Os cortes sugeridos são:

- diários: `periodo_atual - 6 meses`;
- mensais: `periodo_atual - 27 meses`.

A limpeza será aplicada de forma uniforme a todas as famílias:

```sql
delete from ga4_daily_* where metric_date < ?;
delete from ga4_monthly_* where month_start < ?;
```

As duas linhas acima são pseudocódigo de retenção: na migration final serão comandos explícitos para cada tabela, sem wildcard SQL.

## Chaves longas e `dimension_key`

O Worker deverá gerar:

```text
dimension_key = SHA-256(page_path + "\u001f" + label + "\u001f" + button_id + "\u001f" + destination + "\u001f" + intent + "\u001f" + is_contact_lead)
```

O hash será usado apenas em `ga4_*_clicks`. As dimensões originais continuam armazenadas para exibição e filtros. A probabilidade prática de colisão com SHA-256 é desprezível para este uso.

## Pontos para aprovação antes de aplicar

1. Confirmar os nomes finais das 20 tabelas diárias/mensais.
2. Confirmar que `ga4_*_source_medium_results` alimentará `sources`, `sourceMediumResults` e os filtros de aquisição.
3. Confirmar a manutenção de `sessions` em contatos.
4. Confirmar a retenção uniforme: diário por 6 meses e mensal até 27 meses para todas as famílias.
5. Confirmar o uso de `dimension_key` apenas para cliques.
6. Confirmar o fluxo de sincronização `running → upsert → validação → success`.
7. Aplicar os arquivos gerados somente depois da validação local do Wrangler.

## Arquivos gerados

- `cloudflare/d1/migrations/0020_ga4_sync_control.sql`
- `cloudflare/d1/migrations/0021_ga4_core_consolidates.sql`
- `cloudflare/d1/migrations/0022_ga4_dimensions.sql`
- `cloudflare/d1/migrations/0023_ga4_details.sql`

## Aplicação pendente

Nenhuma migration foi aplicada ao D1 remoto. O build passou; a tentativa de validação local via Wrangler ficou sem saída e foi interrompida, portanto a aplicação deve ser repetida com o ambiente do Wrangler disponível antes do staging.
