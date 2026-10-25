-- Migration 0012: Adiciona tabelas consolidadas de dispositivos (daily_devices) e origem/mídia com detalhes de cliques (daily_source_medium_results)
-- para alimentar a tabela de Dispositivo em Público, a tabela de Source/Medium em Resultados e os filtros de Dispositivo, Navegador, Source, Medium e Campaign.

create table if not exists daily_devices (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  page_views integer not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, metric_date, device_type, browser)
);

create index if not exists daily_devices_site_date_idx
  on daily_devices (tracker_site_id, metric_date desc);

create table if not exists daily_source_medium_results (
  tracker_site_id text not null references tracker_sites(tracker_site_id),
  metric_date text not null,
  source text not null default 'Direto',
  medium text not null default 'direto',
  campaign text not null default '',
  device_type text not null default 'desktop',
  browser text not null default 'Outro',
  page_path text not null default '/',
  sessions integer not null default 0,
  page_views integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  general_clicks integer not null default 0,
  contact_clicks integer not null default 0,
  whatsapp_clicks integer not null default 0,
  sign_ups integer not null default 0,
  logins integer not null default 0,
  conversions integer not null default 0,
  primary key (tracker_site_id, metric_date, source, medium, campaign, device_type, browser, page_path)
);

create index if not exists daily_sm_results_site_date_idx
  on daily_source_medium_results (tracker_site_id, metric_date desc);

-- Backfill de daily_devices a partir dos eventos existentes (D-1 e anteriores)
insert into daily_devices (tracker_site_id, metric_date, device_type, browser, sessions, users, new_users, page_views, conversions)
select
  tracker_site_id,
  date(occurred_at) as metric_date,
  coalesce(nullif(lower(trim(device_type)), ''), 'desktop') as device_type,
  coalesce(nullif(trim(browser), ''), 'Outro') as browser,
  count(distinct session_id) as sessions,
  count(distinct visitor_id) as users,
  sum(event_name = 'first_visit') as new_users,
  sum(event_name = 'page_view') as page_views,
  count(distinct case when event_name in ('whatsapp_contact', 'sign_up') or is_conversion = 1 then session_id end) as conversions
from events
where date(occurred_at) <= date('now', '-1 day')
group by
  tracker_site_id,
  date(occurred_at),
  coalesce(nullif(lower(trim(device_type)), ''), 'desktop'),
  coalesce(nullif(trim(browser), ''), 'Outro')
on conflict (tracker_site_id, metric_date, device_type, browser) do update set
  sessions = excluded.sessions,
  users = excluded.users,
  new_users = excluded.new_users,
  page_views = excluded.page_views,
  conversions = excluded.conversions;

-- Backfill de daily_source_medium_results a partir dos eventos existentes (D-1 e anteriores)
insert into daily_source_medium_results (
  tracker_site_id, metric_date, source, medium, campaign, device_type, browser, page_path,
  sessions, page_views, users, new_users, general_clicks, contact_clicks, whatsapp_clicks, sign_ups, logins, conversions
)
select
  tracker_site_id,
  date(occurred_at) as metric_date,
  case
    when lower(source) in ('l.wl.co', 'wl.co', 'wa.me', 'whatsapp', 'api.whatsapp.com', 'web.whatsapp.com') or lower(source) like '%whatsapp.com' then 'WhatsApp'
    when lower(source) in ('facebook.com', 'm.facebook.com', 'l.facebook.com', 'lm.facebook.com', 'web.facebook.com', 'touch.facebook.com', 'fb.com', 'fb.me', 'facebook') or lower(source) like '%facebook.com' then 'Facebook'
    when lower(source) in ('instagram.com', 'l.instagram.com', 'm.instagram.com', 'ig', 'ig.me', 'instagram') or lower(source) like '%instagram.com' then 'Instagram'
    when lower(source) in ('google', 'google.com', 'google.com.br', 'www.google.com') or lower(source) like '%google.com%' then 'Google'
    when lower(source) in ('tiktok', 'tiktok.com', 'vm.tiktok.com', 'm.tiktok.com') or lower(source) like '%tiktok.com' then 'TikTok'
    when lower(source) in ('youtube', 'youtube.com', 'youtu.be', 'm.youtube.com') or lower(source) like '%youtube.com' then 'YouTube'
    when lower(source) in ('t.co', 'twitter', 'twitter.com', 'x.com', 'mobile.twitter.com') then 'X (Twitter)'
    when lower(source) in ('linkedin', 'linkedin.com', 'lnkd.in', 'm.linkedin.com') then 'LinkedIn'
    when lower(source) in ('pinterest', 'pinterest.com', 'pin.it', 'br.pinterest.com') then 'Pinterest'
    when lower(source) in ('telegram', 't.me', 'telegram.org', 'telegram.me', 'web.telegram.org') then 'Telegram'
    when lower(source) in ('threads', 'threads.net', 'l.threads.net') then 'Threads'
    when lower(source) in ('mercadolivre', 'mercadolivre.com.br', 'mercadolivre.com', 'mercadolibre.com') then 'Mercado Livre'
    when lower(source) in ('shopee', 'shopee.com.br', 'shopee.com', 'shp.ee') then 'Shopee'
    when lower(source) in ('bing', 'bing.com') then 'Bing'
    when lower(source) in ('yahoo', 'yahoo.com', 'br.yahoo.com') then 'Yahoo'
    when lower(source) in ('duckduckgo', 'duckduckgo.com') then 'DuckDuckGo'
    when lower(source) in ('kwai', 'kwai.com', 'kwai.app') then 'Kwai'
    when lower(source) in ('reddit', 'reddit.com', 'redd.it') then 'Reddit'
    when lower(source) in ('globo', 'globo.com', 'g1.globo.com', 'ge.globo.com') then 'Globo'
    when lower(source) in ('uol', 'uol.com.br', 'noticias.uol.com.br') then 'UOL'
    when lower(source) in ('direto', 'direct', '(direct)', 'none', '') or source is null then 'Direto'
    else source
  end as source,
  case
    when lower(coalesce(medium, '')) in ('', 'none', '(none)', 'null') then 'direto'
    else lower(trim(medium))
  end as medium,
  coalesce(trim(campaign), '') as campaign,
  coalesce(nullif(lower(trim(device_type)), ''), 'desktop') as device_type,
  coalesce(nullif(trim(browser), ''), 'Outro') as browser,
  coalesce(page_path, '/') as page_path,
  count(distinct session_id) as sessions,
  sum(event_name = 'page_view') as page_views,
  count(distinct visitor_id) as users,
  sum(event_name = 'first_visit') as new_users,
  sum(case
    when event_name in ('button_click', 'media_click', 'login')
      and coalesce(cast(json_extract(metadata_json, '$.is_contact_lead') as integer), 0) = 0
      and coalesce(json_extract(metadata_json, '$.contact_intent'), 'geral') in ('geral', 'outro', 'login')
    then 1 else 0
  end) as general_clicks,
  sum(case
    when event_name in ('whatsapp_contact', 'sign_up')
      or coalesce(cast(json_extract(metadata_json, '$.is_contact_lead') as integer), 0) = 1
      or coalesce(json_extract(metadata_json, '$.contact_intent'), 'geral') not in ('geral', 'outro', 'login')
    then 1 else 0
  end) as contact_clicks,
  sum(case
    when event_name = 'whatsapp_contact'
      or coalesce(json_extract(metadata_json, '$.contact_intent'), '') = 'whatsapp'
      or lower(coalesce(json_extract(metadata_json, '$.destination'), '')) like '%wa.me%'
      or lower(coalesce(json_extract(metadata_json, '$.destination'), '')) like '%whatsapp.com%'
    then 1 else 0
  end) as whatsapp_clicks,
  sum(event_name = 'sign_up') as sign_ups,
  sum(event_name = 'login') as logins,
  count(distinct case when event_name in ('whatsapp_contact', 'sign_up') or is_conversion = 1 then session_id end) as conversions
from events
where date(occurred_at) <= date('now', '-1 day')
group by
  tracker_site_id,
  date(occurred_at),
  source,
  medium,
  coalesce(trim(campaign), ''),
  coalesce(nullif(lower(trim(device_type)), ''), 'desktop'),
  coalesce(nullif(trim(browser), ''), 'Outro'),
  coalesce(page_path, '/')
on conflict (tracker_site_id, metric_date, source, medium, campaign, device_type, browser, page_path) do update set
  sessions = excluded.sessions,
  page_views = excluded.page_views,
  users = excluded.users,
  new_users = excluded.new_users,
  general_clicks = excluded.general_clicks,
  contact_clicks = excluded.contact_clicks,
  whatsapp_clicks = excluded.whatsapp_clicks,
  sign_ups = excluded.sign_ups,
  logins = excluded.logins,
  conversions = excluded.conversions;
