-- Alinha os conceitos das métricas consolidadas com o Google Analytics 4 (GA4):
-- 1. Tempo médio de engajamento (average_engagement_seconds) = soma(engagement_time_ms) / 1000 / usuários ativos (count(distinct visitor_id)).
-- 2. Sessão engajada (Engaged Session GA4) = sessão com >= 10s de engajamento OU >= 2 page_views OU >= 1 conversão.
-- 3. Taxa de saída / Rejeição (exit_rate / Bounce Rate GA4) = % de sessões NÃO engajadas.

insert into daily_metrics (tracker_site_id, metric_date, sessions, users, new_users, page_views, conversions, whatsapp_contacts, sign_ups, logins, average_engagement_seconds, exit_rate)
select
  e.tracker_site_id,
  date(e.occurred_at) as metric_date,
  count(distinct e.session_id) as sessions,
  count(distinct e.visitor_id) as users,
  sum(e.event_name = 'first_visit') as new_users,
  sum(e.event_name = 'page_view') as page_views,
  count(distinct case when e.event_name in ('whatsapp_contact','sign_up') or e.is_conversion = 1 then e.session_id end) as conversions,
  sum(e.event_name = 'whatsapp_contact') as whatsapp_contacts,
  sum(e.event_name = 'sign_up') as sign_ups,
  sum(e.event_name = 'login') as logins,
  coalesce(round((sum(coalesce(e.engagement_time_ms, 0)) / 1000.0) / nullif(count(distinct e.visitor_id), 0)), 0) as average_engagement_seconds,
  round(100.0 * (
    count(distinct e.session_id) - (
      select count(*) from (
        select s.session_id
        from events s
        where s.tracker_site_id = e.tracker_site_id
          and date(s.occurred_at) = date(e.occurred_at)
        group by s.session_id
        having sum(coalesce(s.engagement_time_ms, 0)) >= 10000
            or sum(s.event_name = 'page_view') >= 2
            or sum(s.event_name in ('whatsapp_contact','sign_up') or s.is_conversion = 1) >= 1
      )
    )
  ) / nullif(count(distinct e.session_id), 0), 1) as exit_rate
from events e
where date(e.occurred_at) <= date('now', '-1 day')
group by e.tracker_site_id, date(e.occurred_at)
on conflict(tracker_site_id, metric_date) do update set
  sessions = excluded.sessions,
  users = excluded.users,
  new_users = excluded.new_users,
  page_views = excluded.page_views,
  conversions = excluded.conversions,
  whatsapp_contacts = excluded.whatsapp_contacts,
  sign_ups = excluded.sign_ups,
  logins = excluded.logins,
  average_engagement_seconds = excluded.average_engagement_seconds,
  exit_rate = excluded.exit_rate;

insert into daily_pages (tracker_site_id, metric_date, page_path, page_title, page_views, users, entrances, exits, exit_rate, average_engagement_seconds, conversions)
select
  tracker_site_id,
  date(occurred_at) as metric_date,
  coalesce(page_path, '/') as page_path,
  max(page_title) as page_title,
  sum(event_name = 'page_view') as page_views,
  count(distinct visitor_id) as users,
  count(distinct case when event_name = 'session_start' then session_id end) as entrances,
  (
    count(distinct session_id) - (
      select count(*) from (
        select s.session_id
        from events s
        where s.tracker_site_id = events.tracker_site_id
          and date(s.occurred_at) = date(events.occurred_at)
          and s.session_id in (
            select p2.session_id from events p2
            where p2.tracker_site_id = events.tracker_site_id
              and date(p2.occurred_at) = date(events.occurred_at)
              and coalesce(p2.page_path, '/') = coalesce(events.page_path, '/')
          )
        group by s.session_id
        having sum(coalesce(s.engagement_time_ms, 0)) >= 10000
            or sum(s.event_name = 'page_view') >= 2
            or sum(s.event_name in ('whatsapp_contact','sign_up') or s.is_conversion = 1) >= 1
      )
    )
  ) as exits,
  round(100.0 * (
    count(distinct session_id) - (
      select count(*) from (
        select s.session_id
        from events s
        where s.tracker_site_id = events.tracker_site_id
          and date(s.occurred_at) = date(events.occurred_at)
          and s.session_id in (
            select p2.session_id from events p2
            where p2.tracker_site_id = events.tracker_site_id
              and date(p2.occurred_at) = date(events.occurred_at)
              and coalesce(p2.page_path, '/') = coalesce(events.page_path, '/')
          )
        group by s.session_id
        having sum(coalesce(s.engagement_time_ms, 0)) >= 10000
            or sum(s.event_name = 'page_view') >= 2
            or sum(s.event_name in ('whatsapp_contact','sign_up') or s.is_conversion = 1) >= 1
      )
    )
  ) / nullif(count(distinct session_id), 0), 1) as exit_rate,
  coalesce(round((sum(coalesce(engagement_time_ms, 0)) / 1000.0) / nullif(count(distinct visitor_id), 0)), 0) as average_engagement_seconds,
  count(distinct case when event_name in ('whatsapp_contact','sign_up') or is_conversion = 1 then session_id end) as conversions
from events
where date(occurred_at) <= date('now', '-1 day')
group by tracker_site_id, date(occurred_at), coalesce(page_path, '/')
on conflict(tracker_site_id, metric_date, page_path) do update set
  page_title = excluded.page_title,
  page_views = excluded.page_views,
  users = excluded.users,
  entrances = excluded.entrances,
  exits = excluded.exits,
  exit_rate = excluded.exit_rate,
  average_engagement_seconds = excluded.average_engagement_seconds,
  conversions = excluded.conversions;
