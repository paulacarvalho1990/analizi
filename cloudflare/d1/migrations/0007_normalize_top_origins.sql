-- Normalização das principais origens (WhatsApp, Facebook, Instagram, Google, Direto, etc.)
UPDATE events
SET source = 'WhatsApp',
    medium = CASE WHEN medium IS NULL OR medium IN ('', 'referência', 'referral') THEN 'social' ELSE medium END
WHERE lower(source) IN ('l.wl.co', 'wl.co', 'wa.me', 'whatsapp', 'api.whatsapp.com', 'web.whatsapp.com')
   OR lower(source) LIKE '%whatsapp.com'
   OR lower(referrer_host) IN ('l.wl.co', 'wl.co', 'wa.me')
   OR lower(referrer_host) LIKE '%whatsapp.com';

UPDATE events
SET source = 'Facebook',
    medium = CASE WHEN medium IS NULL OR medium IN ('', 'referência', 'referral') THEN 'social' ELSE medium END
WHERE lower(source) IN ('facebook.com', 'm.facebook.com', 'l.facebook.com', 'lm.facebook.com', 'web.facebook.com', 'touch.facebook.com', 'fb.com', 'fb.me', 'facebook')
   OR lower(source) LIKE '%facebook.com'
   OR lower(referrer_host) IN ('facebook.com', 'm.facebook.com', 'l.facebook.com', 'lm.facebook.com')
   OR lower(referrer_host) LIKE '%facebook.com';

UPDATE events
SET source = 'Instagram',
    medium = CASE WHEN medium IS NULL OR medium IN ('', 'referência', 'referral') THEN 'social' ELSE medium END
WHERE lower(source) IN ('instagram.com', 'l.instagram.com', 'm.instagram.com', 'ig', 'ig.me', 'instagram')
   OR lower(source) LIKE '%instagram.com'
   OR lower(referrer_host) IN ('instagram.com', 'l.instagram.com', 'ig')
   OR lower(referrer_host) LIKE '%instagram.com';

UPDATE events
SET source = 'Google',
    medium = CASE WHEN medium IS NULL OR medium IN ('', 'referência', 'referral') THEN 'orgânico' ELSE medium END
WHERE lower(source) IN ('google', 'google.com', 'google.com.br', 'www.google.com')
   OR lower(referrer_host) LIKE '%google.com%';

UPDATE events
SET source = 'Direto',
    medium = 'direto'
WHERE lower(source) IN ('direto', 'direct', '(direct)', 'none', '')
   OR source IS NULL;

-- Consolidação limpa e unificada em daily_sources para origens normalizadas
DELETE FROM daily_sources WHERE source IN ('facebook.com', 'm.facebook.com', 'Facebook', 'ig', 'instagram', 'Instagram', 'Whatsapp', 'WhatsApp', 'l.wl.co', 'wl.co', 'google', 'Google', 'direto', 'Direto');

INSERT INTO daily_sources (tracker_site_id, metric_date, source, medium, campaign, users, new_users, sessions, page_views, conversions)
SELECT
  tracker_site_id,
  date(occurred_at) as metric_date,
  source,
  coalesce(medium, '') as medium,
  coalesce(campaign, '') as campaign,
  count(distinct visitor_id) as users,
  sum(event_name = 'first_visit') as new_users,
  count(distinct session_id) as sessions,
  sum(event_name = 'page_view') as page_views,
  count(distinct case when event_name in ('whatsapp_contact','sign_up') or is_conversion = 1 then session_id end) as conversions
FROM events
WHERE date(occurred_at) <= date('now', '-1 day')
  AND source IN ('Facebook', 'Instagram', 'WhatsApp', 'Google', 'Direto')
GROUP BY tracker_site_id, date(occurred_at), source, coalesce(medium, ''), coalesce(campaign, '')
ON CONFLICT(tracker_site_id, metric_date, source, medium, campaign) DO UPDATE SET
  users = excluded.users,
  new_users = excluded.new_users,
  sessions = excluded.sessions,
  page_views = excluded.page_views,
  conversions = excluded.conversions;

-- Consolidação limpa e unificada em daily_source_pages para origens normalizadas
DELETE FROM daily_source_pages WHERE source IN ('facebook.com', 'm.facebook.com', 'Facebook', 'ig', 'instagram', 'Instagram', 'Whatsapp', 'WhatsApp', 'l.wl.co', 'wl.co', 'google', 'Google', 'direto', 'Direto');

INSERT INTO daily_source_pages (tracker_site_id, metric_date, source, page_path, page_views, users)
SELECT
  tracker_site_id,
  date(occurred_at) as metric_date,
  source,
  coalesce(page_path, '/') as page_path,
  sum(event_name = 'page_view') as page_views,
  count(distinct visitor_id) as users
FROM events
WHERE date(occurred_at) <= date('now', '-1 day')
  AND source IN ('Facebook', 'Instagram', 'WhatsApp', 'Google', 'Direto')
GROUP BY tracker_site_id, date(occurred_at), source, coalesce(page_path, '/')
ON CONFLICT(tracker_site_id, metric_date, source, page_path) DO UPDATE SET
  page_views = excluded.page_views,
  users = excluded.users;
