-- Normaliza origens históricas do WhatsApp (l.wl.co, wl.co, whatsapp.com, wa.me) para 'Whatsapp'
UPDATE events
SET source = 'Whatsapp',
    medium = CASE WHEN medium IS NULL OR medium IN ('', 'referência', 'referral') THEN 'social' ELSE medium END
WHERE lower(source) IN ('l.wl.co', 'wl.co', 'wa.me')
   OR lower(source) LIKE '%whatsapp.com'
   OR lower(referrer_host) IN ('l.wl.co', 'wl.co', 'wa.me')
   OR lower(referrer_host) LIKE '%whatsapp.com';

UPDATE daily_sources
SET source = 'Whatsapp',
    medium = CASE WHEN medium IS NULL OR medium IN ('', 'referência', 'referral') THEN 'social' ELSE medium END
WHERE lower(source) IN ('l.wl.co', 'wl.co', 'wa.me')
   OR lower(source) LIKE '%whatsapp.com';

UPDATE daily_source_pages
SET source = 'Whatsapp'
WHERE lower(source) IN ('l.wl.co', 'wl.co', 'wa.me')
   OR lower(source) LIKE '%whatsapp.com';
