-- Conversões e intenções de conversão por tipo, página e origem.
-- Intenção: clique que inicia uma ação comercial; confirmada: ação concluída no site.
alter table daily_metrics add column form_submits integer not null default 0;
alter table daily_source_medium_results add column form_submits integer not null default 0;

create table if not exists daily_conversion_events (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  source text not null default 'Direto',
  medium text not null default 'direto',
  campaign text not null default '',
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  page_path text not null default '/',
  conversion_type text not null,
  conversion_name text not null default '',
  conversion_stage text not null default 'confirmada',
  conversions integer not null default 0,
  sessions integer not null default 0,
  primary key (
    tracker_site_id, metric_date, source, medium, campaign, device_type, browser,
    page_path, conversion_type, conversion_name, conversion_stage
  )
);

create index if not exists daily_conversion_events_site_date_idx
  on daily_conversion_events (tracker_site_id, metric_date desc);

update daily_metrics
set form_submits = coalesce((
  select count(*) from events e
  where e.tracker_site_id = daily_metrics.tracker_site_id
    and date(e.occurred_at) = daily_metrics.metric_date
    and e.event_name = 'form_submit'
), 0);

update daily_source_medium_results
set form_submits = coalesce((
  select count(*) from events e
  where e.tracker_site_id = daily_source_medium_results.tracker_site_id
    and date(e.occurred_at) = daily_source_medium_results.metric_date
    and coalesce(e.page_path, '/') = daily_source_medium_results.page_path
    and e.event_name = 'form_submit'
), 0);

-- Histórico disponível: reconstitui conversões e intenções com os eventos já guardados.
insert into daily_conversion_events (
  tracker_site_id, metric_date, source, medium, campaign, device_type, browser,
  page_path, conversion_type, conversion_name, conversion_stage, conversions, sessions
)
select
  tracker_site_id,
  date(occurred_at),
  coalesce(nullif(source, ''), 'Direto'),
  coalesce(nullif(medium, ''), 'direto'),
  coalesce(campaign, ''),
  coalesce(nullif(lower(device_type), ''), 'desktop'),
  coalesce(nullif(browser, ''), 'Outro'),
  coalesce(page_path, '/'),
  case
    when event_name = 'whatsapp_contact' then 'whatsapp'
    when event_name = 'sign_up' then 'cadastro'
    when event_name = 'form_submit' then coalesce(nullif(json_extract(metadata_json, '$.conversion_type'), ''), 'contato')
    when event_name = 'file_download' then 'download'
    when event_name = 'checkout_start' then 'checkout'
    when event_name = 'payment_start' then 'pagamento'
    when event_name = 'subscription_start' then 'assinatura'
    when event_name = 'purchase' then 'compra'
    when event_name = 'subscription' then 'assinatura'
    else 'outro'
  end,
  coalesce(
    nullif(json_extract(metadata_json, '$.form_name'), ''),
    nullif(json_extract(metadata_json, '$.button_label'), ''),
    nullif(json_extract(metadata_json, '$.form_id'), ''),
    ''
  ),
  case
    when event_name in ('checkout_start', 'payment_start', 'subscription_start', 'file_download') then 'intencao'
    else 'confirmada'
  end,
  count(*),
  count(distinct session_id)
from events
where event_name in (
  'whatsapp_contact', 'sign_up', 'form_submit', 'file_download',
  'checkout_start', 'payment_start', 'subscription_start', 'purchase', 'subscription'
)
group by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
on conflict do update set
  conversions = excluded.conversions,
  sessions = excluded.sessions;
