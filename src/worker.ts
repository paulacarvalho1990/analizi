interface D1Statement {
  bind(...values: unknown[]): D1Statement
}

interface D1Database {
  prepare(query: string): D1Statement
  batch(statements: D1Statement[]): Promise<unknown>
}

interface AssetFetcher {
  fetch(request: Request): Promise<Response>
}

interface Env {
  ANALIZI_EVENTS: D1Database
  ASSETS: AssetFetcher
  DEEPINFRA_API_KEY?: string
}

const ALLOWED_EVENTS = new Set([
  'page_view',
  'session_start',
  'first_visit',
  'button_click',
  'media_click',
  'sign_up',
  'form_submit',
  'checkout_start',
  'payment_start',
  'subscription_start',
  'purchase',
  'subscription',
  'login',
  'whatsapp_contact',
  'outbound_click',
  'file_download',
  'form_start',
  'form_abandon',
  'page_layout',
  'scroll_depth',
])

type TrackerEvent = {
  id: string
  trackerSiteId: string
  occurredAt: string
  eventName: string
  visitorId: string
  sessionId: string
  sessionNumber?: number
  pagePath?: string
  pageTitle?: string
  pageUrl?: string
  pageHostname?: string
  referrerHost?: string
  referrerUrl?: string
  source?: string
  medium?: string
  campaign?: string
  campaignContent?: string
  campaignTerm?: string
  deviceType?: string
  browser?: string
  operatingSystem?: string
  language?: string
  engagementTimeMs?: number
  loadTimeMs?: number
  isConversion?: boolean
  metadata?: Record<string, unknown>
}

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      ...(extraHeaders || {}),
    },
  })
}

function compactText(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '{}'
  const clean = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 12)
      .map(([key, item]) => [key.slice(0, 48), typeof item === 'string' ? item.slice(0, 240) : item])
      .filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item)),
  )
  const serialized = JSON.stringify(clean)
  return serialized.length <= 2_000 ? serialized : '{}'
}

function requestedHost(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return null
  try {
    return new URL(origin).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

async function collect(request: Request, env: Env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } })
  }
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const size = Number(request.headers.get('content-length') || 0)
  if (size > 120_000) return json({ error: 'Evento muito grande.' }, 413)

  let payload: { events?: TrackerEvent[] }
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Formato inválido.' }, 400)
  }
  const events = Array.isArray(payload.events) ? payload.events.slice(0, 10) : []
  if (!events.length) return json({ error: 'Nenhum evento enviado.' }, 400)

  const siteId = compactText(events[0].trackerSiteId, 32)
  if (!siteId || events.some((event) => compactText(event.trackerSiteId, 32) !== siteId)) {
    return json({ error: 'Identificação do site inválida.' }, 400)
  }

  // D1's first() is omitted from the light local interface above; query through batch keeps Worker typing dependency-free.
  const siteResult = await env.ANALIZI_EVENTS.batch([env.ANALIZI_EVENTS.prepare('select tracker_site_id, domain, is_active from tracker_sites where tracker_site_id = ?').bind(siteId)]) as Array<{ results?: Array<{ tracker_site_id: string; domain: string; is_active: number }> }>
  const foundSite = siteResult[0]?.results?.[0]
  if (!foundSite || !foundSite.is_active) return json({ error: 'Site não encontrado.' }, 404)

  const originHost = requestedHost(request)
  const expectedHost = foundSite.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
  if (originHost && originHost !== expectedHost) return json({ error: 'Origem não autorizada.' }, 403)

  const statements: D1Statement[] = []
  const usageMonth = new Date().toISOString().slice(0, 7)

  // Captura localização geográfica anônima via Cloudflare Edge (request.cf) sem armazenar IP
  const cf = (request as Request & { cf?: { country?: string; region?: string; regionCode?: string; city?: string } }).cf
  const rawCountry = compactText(cf?.country || request.headers.get('cf-ipcountry'), 64)
  const geoCountry = rawCountry && rawCountry !== 'XX' && rawCountry !== 'T1' ? rawCountry : null
  const geoRegion = compactText(cf?.region || cf?.regionCode, 120) || null
  const geoCity = compactText(cf?.city, 120) || null

  const isAuthSource = (s?: string | null) => {
    if (!s) return false
    return /accounts\.google\.com|appleid\.apple\.com|login\.microsoftonline\.com|auth0\.com|supabase\.co/i.test(s) ||
      /(?:auth|login|oauth|accounts)/i.test(s)
  }

  const normalizeTrafficSource = (s?: string | null, ref?: string | null): { source: string; medium?: string } | null => {
    const check = (val?: string | null) => {
      if (!val) return null
      const h = val.toLowerCase().trim().replace(/^www\./, '')
      if (h === 'direto' || h === '(direct)' || h === 'direct' || h === 'none' || h === 'null' || h === '') return { source: 'Direto', medium: 'direto' }
      if (h === 'l.wl.co' || h === 'wl.co' || h === 'wa.me' || h === 'whatsapp' || /(?:^|\.)whatsapp\.com$/i.test(h)) return { source: 'WhatsApp', medium: 'social' }
      if (h === 'facebook' || h === 'fb.me' || h === 'fb.com' || /(?:^|\.)facebook\.com$/i.test(h)) return { source: 'Facebook', medium: 'social' }
      if (h === 'instagram' || h === 'ig' || h === 'ig.me' || /(?:^|\.)instagram\.com$/i.test(h)) return { source: 'Instagram', medium: 'social' }
      if (h === 'google' || h === 'google-play' || /(?:^|\.)google\.(?:com|com\.br|co\.[a-z]+|[a-z]{2})$/i.test(h)) return { source: 'Google', medium: 'orgânico' }
      if (h === 'tiktok' || /(?:^|\.)tiktok\.com$/i.test(h)) return { source: 'TikTok', medium: 'social' }
      if (h === 'youtube' || h === 'youtu.be' || /(?:^|\.)youtube\.com$/i.test(h)) return { source: 'YouTube', medium: 'social' }
      if (h === 'twitter' || h === 'x' || h === 't.co' || /(?:^|\.)twitter\.com$/i.test(h) || h === 'x.com') return { source: 'X (Twitter)', medium: 'social' }
      if (h === 'linkedin' || h === 'lnkd.in' || /(?:^|\.)linkedin\.com$/i.test(h)) return { source: 'LinkedIn', medium: 'social' }
      if (h === 'pinterest' || h === 'pin.it' || /(?:^|\.)pinterest\.com$/i.test(h)) return { source: 'Pinterest', medium: 'social' }
      if (h === 'telegram' || h === 't.me' || /(?:^|\.)telegram\.(?:org|me)$/i.test(h)) return { source: 'Telegram', medium: 'social' }
      if (h === 'threads' || /(?:^|\.)threads\.net$/i.test(h)) return { source: 'Threads', medium: 'social' }
      if (h === 'mercadolivre' || /(?:^|\.)mercadolivre\.com(?:\.br)?$/i.test(h) || /(?:^|\.)mercadolibre\.com$/i.test(h)) return { source: 'Mercado Livre', medium: 'referência' }
      if (h === 'shopee' || h === 'shp.ee' || /(?:^|\.)shopee\.com(?:\.br)?$/i.test(h)) return { source: 'Shopee', medium: 'referência' }
      if (h === 'bing' || /(?:^|\.)bing\.com$/i.test(h)) return { source: 'Bing', medium: 'orgânico' }
      if (h === 'yahoo' || /(?:^|\.)yahoo\.com(?:\.br)?$/i.test(h)) return { source: 'Yahoo', medium: 'orgânico' }
      if (h === 'duckduckgo' || /(?:^|\.)duckduckgo\.com$/i.test(h)) return { source: 'DuckDuckGo', medium: 'orgânico' }
      if (h === 'kwai' || /(?:^|\.)kwai\.(?:com|app)$/i.test(h)) return { source: 'Kwai', medium: 'social' }
      if (h === 'reddit' || h === 'redd.it' || /(?:^|\.)reddit\.com$/i.test(h)) return { source: 'Reddit', medium: 'social' }
      if (h === 'globo' || /(?:^|\.)globo\.com$/i.test(h)) return { source: 'Globo', medium: 'referência' }
      if (h === 'uol' || /(?:^|\.)uol\.com\.br$/i.test(h)) return { source: 'UOL', medium: 'referência' }
      return null
    }
    return check(s) || check(ref)
  }

  for (const event of events) {
    const name = compactText(event.eventName, 40)
    if (!ALLOWED_EVENTS.has(name)) continue
    const id = compactText(event.id, 64)
    const visitorId = compactText(event.visitorId, 80)
    const sessionId = compactText(event.sessionId, 80)
    if (!id || !visitorId || !sessionId) continue

    let rawSource = compactText(event.source, 120) || null
    let rawMedium = compactText(event.medium, 120)
    let rawCampaign = compactText(event.campaign, 240)
    const rawContent = compactText(event.campaignContent, 240) || null
    const rawTerm = compactText(event.campaignTerm, 240) || null
    const refHost = compactText(event.referrerHost, 253) || null

    if (isAuthSource(rawSource)) {
      rawSource = 'Direto'
      rawMedium = rawMedium === 'referência' ? 'direto' : rawMedium
    } else {
      const known = normalizeTrafficSource(rawSource, refHost)
      if (known) {
        rawSource = known.source
        if (!rawMedium || rawMedium === 'referência' || rawMedium === 'referral') {
          rawMedium = known.medium || 'social'
        }
      }
    }

    // Trata armazenamento estrutural de Layout (sem gravar na tabela events para economizar espaço)
    if (name === 'page_layout') {
      const layoutObj = (event.metadata as { layout?: { viewport_width?: number; viewport_height?: number; page_height?: number; blocks?: unknown[] } })?.layout
      if (layoutObj && Array.isArray(layoutObj.blocks)) {
        const pagePath = compactText(event.pagePath, 1_024) || '/'
        const devType = compactText(event.deviceType, 32) || 'desktop'
        const vpW = Number(layoutObj.viewport_width) || 1280
        const vpH = Number(layoutObj.viewport_height) || 800
        const pageH = Number(layoutObj.page_height) || 1200
        const layoutJson = JSON.stringify(layoutObj.blocks.slice(0, 120))
        statements.push(env.ANALIZI_EVENTS.prepare(`
          insert into page_layouts (tracker_site_id, page_path, device_type, viewport_width, viewport_height, page_height, layout_json, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, current_timestamp)
          on conflict(tracker_site_id, page_path, device_type) do update set
            viewport_width = excluded.viewport_width,
            viewport_height = excluded.viewport_height,
            page_height = excluded.page_height,
            layout_json = excluded.layout_json,
            updated_at = current_timestamp
        `).bind(siteId, pagePath, devType, vpW, vpH, pageH, layoutJson))
      }
      continue
    }

    // Trata consolidação de Scroll Depth e captura do tempo de atenção final ao sair da página/aba
    if (name === 'scroll_depth') {
      const meta = event.metadata as { depth_brackets?: string[] } | undefined
      const brackets = Array.isArray(meta?.depth_brackets) ? meta.depth_brackets : []
      const pagePath = compactText(event.pagePath, 1_024) || '/'
      const devType = compactText(event.deviceType, 32) || 'desktop'
      const metricDate = (compactText(event.occurredAt, 40) || new Date().toISOString()).slice(0, 10)

      for (const bracket of brackets) {
        if (['25%', '50%', '75%', '100%'].includes(bracket)) {
          statements.push(env.ANALIZI_EVENTS.prepare(`
            insert into daily_page_scroll (tracker_site_id, metric_date, page_path, device_type, depth_bracket, visitors)
            values (?, ?, ?, ?, ?, 1)
            on conflict(tracker_site_id, metric_date, page_path, device_type, depth_bracket) do update set
              visitors = daily_page_scroll.visitors + 1
          `).bind(siteId, metricDate, pagePath, devType, bracket))
        }
      }
      // Não dá continue: permite registrar o evento na tabela events com seu engagement_time_ms
      // para que todo o tempo de leitura até fechar ou trocar de aba/página seja somado no Tempo de Atenção.
    }

    const metricDate = (compactText(event.occurredAt, 40) || new Date().toISOString()).slice(0, 10)

    statements.push(env.ANALIZI_EVENTS.prepare(`
      insert into events (
        id, tracker_site_id, occurred_at, received_at, event_name, visitor_id, session_id, session_number,
        page_path, page_title, page_url, page_hostname, referrer_host, referrer_url,
        source, medium, campaign, campaign_content, campaign_term, device_type, browser, operating_system, language,
        country, region, city,
        engagement_time_ms, load_time_ms, is_conversion, metadata_json
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, compactText(event.occurredAt, 40) || new Date().toISOString(), new Date().toISOString(), name, visitorId, sessionId,
      Number.isInteger(event.sessionNumber) ? event.sessionNumber : null,
      compactText(event.pagePath, 1_024) || null, compactText(event.pageTitle, 512) || null,
      compactText(event.pageUrl, 2_048) || null, compactText(event.pageHostname, 253) || null,
      compactText(event.referrerHost, 253) || null, compactText(event.referrerUrl, 2_048) || null,
      rawSource, rawMedium, rawCampaign, rawContent, rawTerm,
      compactText(event.deviceType, 32) || null, compactText(event.browser, 80) || null,
      compactText(event.operatingSystem, 80) || null, compactText(event.language, 35) || null,
      geoCountry, geoRegion, geoCity,
      Number.isFinite(event.engagementTimeMs) ? Math.max(0, Math.min(Number(event.engagementTimeMs), 3_600_000)) : null,
      Number.isFinite(event.loadTimeMs) ? Math.max(0, Math.min(Number(event.loadTimeMs), 60_000)) : null,
      event.isConversion ? 1 : 0, safeMetadata(event.metadata),
    ))

    // Atualiza consolidação diária de localização geográfica em tempo real para page_view, session_start e conversões
    if (geoCountry && (name === 'page_view' || name === 'session_start' || name === 'first_visit' || name === 'whatsapp_contact' || name === 'sign_up' || event.isConversion)) {
      const addPv = name === 'page_view' ? 1 : 0
      const addSess = name === 'session_start' ? 1 : 0
      const addUser = name === 'first_visit' || name === 'session_start' ? 1 : 0
      const addConv = name === 'whatsapp_contact' || name === 'sign_up' || event.isConversion ? 1 : 0
      statements.push(env.ANALIZI_EVENTS.prepare(`
        insert into daily_locations (tracker_site_id, metric_date, country, region, city, page_views, users, sessions, conversions)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?)
        on conflict(tracker_site_id, metric_date, country, region, city) do update set
          page_views = daily_locations.page_views + excluded.page_views,
          users = max(daily_locations.users, daily_locations.users + excluded.users),
          sessions = daily_locations.sessions + excluded.sessions,
          conversions = daily_locations.conversions + excluded.conversions
      `).bind(
        siteId,
        metricDate,
        geoCountry,
        geoRegion || 'Não identificado',
        geoCity || 'Não identificada',
        addPv,
        addUser,
        addSess,
        addConv
      ))
    }
  }

  if (!statements.length) return json({ error: 'Eventos inválidos.' }, 400)
  statements.push(env.ANALIZI_EVENTS.prepare(`
    insert into monthly_event_usage (tracker_site_id, usage_month, event_count)
    values (?, ?, ?)
    on conflict(tracker_site_id, usage_month) do update set
      event_count = monthly_event_usage.event_count + excluded.event_count,
      updated_at = current_timestamp
  `).bind(siteId, usageMonth, statements.length))
  await env.ANALIZI_EVENTS.batch(statements)
  return json({ accepted: statements.length - 1 }, 202)
}

function trackerId(value: unknown) {
  const id = compactText(value, 32).toUpperCase()
  return /^ANLZ[A-Z0-9]{5}-A$/.test(id) ? id : ''
}

function siteDomain(value: unknown) {
  const domain = compactText(value, 253).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) ? domain : ''
}

async function provisionTrackerSite(request: Request, env: Env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' } })
  if (request.method === 'GET') {
    const listResult = await env.ANALIZI_EVENTS.batch([
      env.ANALIZI_EVENTS.prepare('select tracker_site_id, supabase_site_id, business_id, plan, domain, is_active, created_at from tracker_sites where is_active = 1 order by created_at asc')
    ]) as Array<{ results?: Array<{ tracker_site_id: string; supabase_site_id: string; business_id: string; plan: string; domain: string; is_active: number; created_at: string }> }>
    return json({ sites: listResult[0]?.results || [] })
  }
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  let payload: { trackerSiteId?: unknown, domain?: unknown, supabaseSiteId?: unknown, businessId?: unknown, plan?: unknown }
  try { payload = await request.json() } catch { return json({ error: 'Formato inválido.' }, 400) }
  const id = trackerId(payload.trackerSiteId)
  const domain = siteDomain(payload.domain)
  const supabaseSiteId = compactText(payload.supabaseSiteId, 64)
  const businessId = compactText(payload.businessId, 64)
  const rawPlan = compactText(payload.plan, 24).toLowerCase()
  const plan = rawPlan === 'admin' || rawPlan === 'growth' ? rawPlan : 'essential'
  if (!id || !domain) return json({ error: 'Identificação ou domínio inválido.' }, 400)
  await env.ANALIZI_EVENTS.batch([env.ANALIZI_EVENTS.prepare(`
    insert into tracker_sites (tracker_site_id, supabase_site_id, business_id, plan, domain, is_active)
    values (?, ?, ?, ?, ?, 1)
    on conflict(tracker_site_id) do update set domain = excluded.domain, plan = case when tracker_sites.plan = 'admin' then 'admin' else excluded.plan end, is_active = 1, updated_at = current_timestamp
  `).bind(id, supabaseSiteId || id, businessId || id, plan, domain)])
  return json({ trackerSiteId: id, domain, plan })
}

async function trackerStatus(id: string, env: Env) {
  const safeId = trackerId(id)
  if (!safeId) return json({ error: 'Identificação inválida.' }, 400)
  const result = await env.ANALIZI_EVENTS.batch([env.ANALIZI_EVENTS.prepare(`
    select s.tracker_site_id, max(e.received_at) as last_event_at
    from tracker_sites s left join events e on e.tracker_site_id = s.tracker_site_id
    where s.tracker_site_id = ? and s.is_active = 1
    group by s.tracker_site_id
  `).bind(safeId)]) as Array<{ results?: Array<{ tracker_site_id: string, last_event_at: string | null }> }>
  const row = result[0]?.results?.[0]
  if (!row) return json({ configured: false, received: false }, 404)
  return json({ configured: true, received: Boolean(row.last_event_at), lastEventAt: row.last_event_at })
}

function isoDate(value: Date) { return value.toISOString().slice(0, 10) }
function shiftDate(value: string, days: number) { const date = new Date(`${value}T00:00:00.000Z`); date.setUTCDate(date.getUTCDate() + days); return isoDate(date) }
function validDate(value: string | null) { return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))) }

const SQL_NORMALIZED_SOURCE = `case
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
end`

const SQL_NORMALIZED_MEDIUM = `case
  when lower(coalesce(medium, '')) in ('', 'none', '(none)', 'null') then 'direto'
  else lower(trim(medium))
end`

const SQL_NORMALIZED_DEVICE = `coalesce(nullif(lower(trim(device_type)), ''), 'desktop')`
const SQL_NORMALIZED_BROWSER = `coalesce(nullif(trim(browser), ''), 'Outro')`
const SQL_NORMALIZED_CAMPAIGN = `coalesce(trim(campaign), '')`

async function analytics(id: string, env: Env, query: URLSearchParams) {
  const safeId = trackerId(id)
  if (!safeId) return json({ error: 'Identificação inválida.' }, 400)
  const requestedDays = Math.min(730, Math.max(1, Math.floor(Number(query.get('days') || 7))))
  const requestedEnd = query.get('end')
  const requestedStart = query.get('start')
  const today = isoDate(new Date())
  const yesterday = shiftDate(today, -1)
  // Na Abordagem A (100% consolidado), a data limite é sempre D-1 (ontem)
  const end = validDate(requestedEnd) && requestedEnd! < today ? requestedEnd! : yesterday
  let start = validDate(requestedStart) ? requestedStart! : shiftDate(end, -requestedDays + 1)
  if (start > end) start = end
  const rawDays = Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1
  const period = Math.min(730, Math.max(1, rawDays))
  if (rawDays > 730) start = shiftDate(end, -729)
  const previousStart = shiftDate(start, -period)
  const group = query.get('group') || 'day'
  const groupExpressionsConsolidated: Record<string, string> = {
    day: "metric_date",
    week: "strftime('%Y-W%W', metric_date)",
    month: "strftime('%Y-%m', metric_date)",
    quarter: "strftime('%Y', metric_date) || '-T' || cast(((cast(strftime('%m', metric_date) as integer) - 1) / 3 + 1) as text)",
    semester: "strftime('%Y', metric_date) || '-S' || case when cast(strftime('%m', metric_date) as integer) <= 6 then '1' else '2' end",
    year: "strftime('%Y', metric_date)"
  }
  const groupConsolidated = groupExpressionsConsolidated[group] || groupExpressionsConsolidated.day
  const page = compactText(query.get('page'), 1024)
  const source = compactText(query.get('source'), 120)
  const medium = compactText(query.get('medium'), 120)
  const campaign = compactText(query.get('campaign'), 240)
  const device = compactText(query.get('device'), 32)
  const browser = compactText(query.get('browser'), 80)

  const hasDimensionFilter = Boolean(page || source || medium || campaign || device || browser)

  const buildSmWhere = (alias = '') => {
    const p = alias ? `${alias}.` : ''
    let sql = ''
    const params: unknown[] = []
    if (page) { sql += ` and ${p}page_path = ?`; params.push(page) }
    if (source) { sql += ` and lower(${p}source) = lower(?)`; params.push(source) }
    if (medium) { sql += ` and lower(${p}medium) = lower(?)`; params.push(medium) }
    if (campaign) { sql += ` and lower(${p}campaign) = lower(?)`; params.push(campaign) }
    if (device) { sql += ` and lower(${p}device_type) = lower(?)`; params.push(device) }
    if (browser) { sql += ` and lower(${p}browser) = lower(?)`; params.push(browser) }
    return { sql, params }
  }

  const smWhere = buildSmWhere()
  const pageFilterDaily = page ? ' and page_path = ?' : ''
  const sourceFilterDaily = source ? ' and lower(source) = lower(?)' : ''

  // 100% das métricas são extraídas das tabelas consolidadas diárias
  const results = await env.ANALIZI_EVENTS.batch([
    // 0: totals (Conceitos alinhados ao GA4: Key Events para contacts, Sessões convertidas para contactSessions, e Tempo médio de engajamento por usuário ativo)
    hasDimensionFilter
      ? env.ANALIZI_EVENTS.prepare(`
          select
            coalesce(sum(r.page_views), 0) as pageViews,
            coalesce(sum(r.sessions), 0) as sessions,
            coalesce(sum(r.users), 0) as users,
            coalesce(sum(r.new_users), 0) as newUsers,
            coalesce(sum(r.whatsapp_clicks + r.sign_ups + r.form_submits), 0) as contacts,
            coalesce(sum(r.conversions), 0) as contactSessions,
            coalesce(sum(r.whatsapp_clicks), 0) as whatsappContacts,
            coalesce(sum(r.sign_ups), 0) as signUps,
            coalesce(sum(r.logins), 0) as logins,
            coalesce(
              (select round(sum(p.average_engagement_seconds * coalesce(nullif(p.users, 0), p.page_views)) / nullif(sum(coalesce(nullif(p.users, 0), p.page_views)), 0))
               from daily_pages p
               where p.tracker_site_id = ? and p.metric_date >= ? and p.metric_date <= ?${page ? ' and p.page_path = ?' : ''}),
              0
            ) as attentionSeconds
          from daily_source_medium_results r
          where r.tracker_site_id = ? and r.metric_date >= ? and r.metric_date <= ?${smWhere.sql}
        `).bind(...[safeId, start, end, ...(page ? [page] : []), safeId, start, end, ...smWhere.params])
      : env.ANALIZI_EVENTS.prepare(`
          select
            coalesce(sum(m.page_views), 0) as pageViews,
            coalesce(sum(m.sessions), 0) as sessions,
            coalesce(sum(m.users), 0) as users,
            coalesce(sum(m.new_users), 0) as newUsers,
            coalesce(sum(m.whatsapp_contacts + m.sign_ups + m.form_submits), 0) as contacts,
            coalesce(sum(m.conversions), 0) as contactSessions,
            coalesce(sum(m.whatsapp_contacts), 0) as whatsappContacts,
            coalesce(sum(m.sign_ups), 0) as signUps,
            coalesce(sum(m.logins), 0) as logins,
            round(sum(m.average_engagement_seconds * coalesce(nullif(m.users, 0), m.sessions)) / nullif(sum(coalesce(nullif(m.users, 0), m.sessions)), 0)) as attentionSeconds
          from daily_metrics m
          where m.tracker_site_id = ? and m.metric_date >= ? and m.metric_date <= ?
        `).bind(safeId, start, end),
    // 1: sources
    hasDimensionFilter
      ? env.ANALIZI_EVENTS.prepare(`
          select source as name, sum(page_views) as value
          from daily_source_medium_results
          where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${smWhere.sql}
          group by source
          order by value desc limit 8
        `).bind(safeId, start, end, ...smWhere.params)
      : env.ANALIZI_EVENTS.prepare(`
          select ${SQL_NORMALIZED_SOURCE} as name, sum(page_views) as value
          from daily_sources
          where tracker_site_id = ? and metric_date >= ? and metric_date <= ?
          group by ${SQL_NORMALIZED_SOURCE}
          order by value desc limit 8
        `).bind(safeId, start, end),
    // 2: pages (GA4: Tempo médio de engajamento por usuário na página e Taxa de saída = sessões não engajadas / sessões da página)
    hasDimensionFilter
      ? env.ANALIZI_EVENTS.prepare(`
          select
            r.page_path as path,
            (select max(dp.page_title) from daily_pages dp where dp.tracker_site_id = r.tracker_site_id and dp.page_path = r.page_path) as title,
            sum(r.page_views) as views,
            (select round(sum(dp.average_engagement_seconds * coalesce(nullif(dp.users, 0), dp.page_views)) / nullif(sum(coalesce(nullif(dp.users, 0), dp.page_views)), 0))
             from daily_pages dp where dp.tracker_site_id = r.tracker_site_id and dp.page_path = r.page_path and dp.metric_date >= ? and dp.metric_date <= ?) as attentionSeconds,
            (select round(sum(dp.exit_rate * dp.page_views) / nullif(sum(dp.page_views), 0), 1)
             from daily_pages dp where dp.tracker_site_id = r.tracker_site_id and dp.page_path = r.page_path and dp.metric_date >= ? and dp.metric_date <= ?) as exitRate,
            (select round(sum(dp.average_load_time_ms * dp.page_views) / nullif(sum(dp.page_views), 0))
             from daily_pages dp where dp.tracker_site_id = r.tracker_site_id and dp.page_path = r.page_path and dp.metric_date >= ? and dp.metric_date <= ?) as loadTimeMs
          from daily_source_medium_results r
          where r.tracker_site_id = ? and r.metric_date >= ? and r.metric_date <= ?${smWhere.sql}
          group by r.page_path
          order by views desc limit 250
        `).bind(start, end, start, end, start, end, safeId, start, end, ...smWhere.params)
      : env.ANALIZI_EVENTS.prepare(`
          select
            coalesce(page_path, '/') as path,
            max(page_title) as title,
            sum(page_views) as views,
            round(sum(average_engagement_seconds * coalesce(nullif(users, 0), page_views)) / nullif(sum(coalesce(nullif(users, 0), page_views)), 0)) as attentionSeconds,
            round(sum(exit_rate * page_views) / nullif(sum(page_views), 0), 1) as exitRate,
            round(sum(average_load_time_ms * page_views) / nullif(sum(page_views), 0)) as loadTimeMs
          from daily_pages
          where tracker_site_id = ? and metric_date >= ? and metric_date <= ?
          group by coalesce(page_path, '/')
          order by views desc limit 250
        `).bind(safeId, start, end),
    // 3: daily
    hasDimensionFilter
      ? env.ANALIZI_EVENTS.prepare(`
          select
            ${groupConsolidated} as date,
            sum(sessions) as sessions,
            sum(users) as users,
            sum(page_views) as pageViews,
            sum(whatsapp_clicks + sign_ups + form_submits) as contacts
          from daily_source_medium_results
          where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${smWhere.sql}
          group by ${groupConsolidated}
          order by date
        `).bind(safeId, start, end, ...smWhere.params)
      : env.ANALIZI_EVENTS.prepare(`
          select
            ${groupConsolidated} as date,
            sum(sessions) as sessions,
            sum(users) as users,
            sum(page_views) as pageViews,
            sum(whatsapp_contacts + sign_ups + form_submits) as contacts
          from daily_metrics
          where tracker_site_id = ? and metric_date >= ? and metric_date <= ?
          group by ${groupConsolidated}
          order by date
        `).bind(safeId, start, end),
    // 4: sourcePages
    hasDimensionFilter
      ? env.ANALIZI_EVENTS.prepare(`
          select
            source,
            page_path as path,
            sum(page_views) as views,
            sum(users) as users
          from daily_source_medium_results
          where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${smWhere.sql}
          group by source, page_path
          order by views desc limit 250
        `).bind(safeId, start, end, ...smWhere.params)
      : env.ANALIZI_EVENTS.prepare(`
          select
            ${SQL_NORMALIZED_SOURCE} as source,
            page_path as path,
            sum(page_views) as views,
            sum(users) as users
          from daily_source_pages
          where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${pageFilterDaily}${sourceFilterDaily}
          group by ${SQL_NORMALIZED_SOURCE}, page_path
          order by views desc limit 250
        `).bind(...[safeId, start, end, ...(page ? [page] : []), ...(source ? [source] : [])]),
    // 5: contactDetails
    env.ANALIZI_EVENTS.prepare(`
      select
        metric_date as date,
        contact_type as type,
        page_path as path,
        sum(contacts) as contacts
      from daily_contacts
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${pageFilterDaily}
      group by metric_date, contact_type, page_path
      order by date desc, contacts desc limit 250
    `).bind(...[safeId, start, end, ...(page ? [page] : [])]),
    // 6: clickDetails
    env.ANALIZI_EVENTS.prepare(`
      select
        metric_date as date,
        page_path as path,
        button_label as label,
        button_id as buttonId,
        destination,
        contact_intent as intent,
        is_contact_lead as isContactLead,
        sum(clicks) as clicks,
        sum(sessions) as sessions
      from daily_button_clicks
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${pageFilterDaily}
      group by metric_date, page_path, button_label, button_id, destination, contact_intent, is_contact_lead
      order by clicks desc, date desc limit 250
    `).bind(...[safeId, start, end, ...(page ? [page] : [])]),
    // 7: previousTotals
    hasDimensionFilter
      ? env.ANALIZI_EVENTS.prepare(`
          select
            coalesce(sum(r.page_views), 0) as pageViews,
            coalesce(sum(r.sessions), 0) as sessions,
            coalesce(sum(r.users), 0) as users,
            coalesce(sum(r.new_users), 0) as newUsers,
            coalesce(sum(r.whatsapp_clicks + r.sign_ups + r.form_submits), 0) as contacts,
            coalesce(sum(r.conversions), 0) as contactSessions,
            coalesce(sum(r.whatsapp_clicks), 0) as whatsappContacts,
            coalesce(sum(r.sign_ups), 0) as signUps,
            coalesce(sum(r.logins), 0) as logins,
            coalesce(
              (select round(sum(p.average_engagement_seconds * coalesce(nullif(p.users, 0), p.page_views)) / nullif(sum(coalesce(nullif(p.users, 0), p.page_views)), 0))
               from daily_pages p
               where p.tracker_site_id = ? and p.metric_date >= ? and p.metric_date < ?${page ? ' and p.page_path = ?' : ''}),
              0
            ) as attentionSeconds
          from daily_source_medium_results r
          where r.tracker_site_id = ? and r.metric_date >= ? and r.metric_date < ?${smWhere.sql}
        `).bind(...[safeId, previousStart, start, ...(page ? [page] : []), safeId, previousStart, start, ...smWhere.params])
      : env.ANALIZI_EVENTS.prepare(`
          select
            coalesce(sum(m.page_views), 0) as pageViews,
            coalesce(sum(m.sessions), 0) as sessions,
            coalesce(sum(m.users), 0) as users,
            coalesce(sum(m.new_users), 0) as newUsers,
            coalesce(sum(m.whatsapp_contacts + m.sign_ups + m.form_submits), 0) as contacts,
            coalesce(sum(m.conversions), 0) as contactSessions,
            coalesce(sum(m.whatsapp_contacts), 0) as whatsappContacts,
            coalesce(sum(m.sign_ups), 0) as signUps,
            coalesce(sum(m.logins), 0) as logins,
            round(sum(m.average_engagement_seconds * coalesce(nullif(m.users, 0), m.sessions)) / nullif(sum(coalesce(nullif(m.users, 0), m.sessions)), 0)) as attentionSeconds
          from daily_metrics m
          where m.tracker_site_id = ? and m.metric_date >= ? and m.metric_date < ?
        `).bind(safeId, previousStart, start),
    // 8: pageComparison
    env.ANALIZI_EVENTS.prepare(`
      select
        coalesce(page_path, '/') as path,
        sum(case when metric_date >= ? and metric_date <= ? then page_views else 0 end) as currentViews,
        sum(case when metric_date >= ? and metric_date < ? then page_views else 0 end) as previousViews
      from daily_pages
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?
      group by path
      having currentViews > 0 or previousViews > 0
      order by currentViews desc limit 30
    `).bind(start, end, previousStart, start, safeId, previousStart, end),
    // 9: filterPages
    env.ANALIZI_EVENTS.prepare(`
      select distinct page_path as path from daily_pages where tracker_site_id = ? and metric_date >= ? and metric_date <= ? order by path limit 250
    `).bind(safeId, start, end),
    // 10: filterSources
    env.ANALIZI_EVENTS.prepare(`
      select distinct source from daily_source_medium_results where tracker_site_id = ? and metric_date >= ? and metric_date <= ? and source != '' order by source limit 100
    `).bind(safeId, start, end),
    // 11: locations (Cidade, Estado e País consolidados)
    env.ANALIZI_EVENTS.prepare(`
      select
        country,
        region,
        city,
        sum(page_views) as views,
        sum(users) as users,
        sum(sessions) as sessions,
        sum(conversions) as conversions
      from daily_locations
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?
      group by country, region, city
      order by views desc, users desc limit 250
    `).bind(safeId, start, end),
    // 12: filterMediums
    env.ANALIZI_EVENTS.prepare(`
      select distinct medium from daily_source_medium_results where tracker_site_id = ? and metric_date >= ? and metric_date <= ? and medium != '' order by medium limit 100
    `).bind(safeId, start, end),
    // 13: filterCampaigns
    env.ANALIZI_EVENTS.prepare(`
      select distinct campaign from daily_source_medium_results where tracker_site_id = ? and metric_date >= ? and metric_date <= ? and campaign != '' order by campaign limit 100
    `).bind(safeId, start, end),
    // 14: filterDevices
    env.ANALIZI_EVENTS.prepare(`
      select distinct device_type as device from daily_source_medium_results where tracker_site_id = ? and metric_date >= ? and metric_date <= ? and device_type != '' order by device limit 50
    `).bind(safeId, start, end),
    // 15: filterBrowsers
    env.ANALIZI_EVENTS.prepare(`
      select distinct browser from daily_source_medium_results where tracker_site_id = ? and metric_date >= ? and metric_date <= ? and browser != '' order by browser limit 50
    `).bind(safeId, start, end),
    // 16: devices (Tabela de Dispositivo na tela de Público)
    env.ANALIZI_EVENTS.prepare(`
      select
        device_type as device,
        browser,
        sum(sessions) as sessions,
        sum(page_views) as views,
        sum(users) as users,
        sum(new_users) as newUsers,
        sum(conversions) as conversions
      from daily_source_medium_results
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${smWhere.sql}
      group by device_type, browser
      order by views desc, sessions desc limit 100
    `).bind(safeId, start, end, ...smWhere.params),
    // 17: sourceMediumResults (Tabela de Source/Medium na tela de Resultados)
    env.ANALIZI_EVENTS.prepare(`
      select
        source,
        medium,
        campaign,
        sum(sessions) as sessions,
        sum(page_views) as pageViews,
        sum(users) as users,
        sum(general_clicks) as generalClicks,
        sum(contact_clicks) as contactClicks,
        sum(whatsapp_clicks) as whatsappClicks,
        sum(sign_ups) as signUps,
        sum(conversions) as conversions
      from daily_source_medium_results
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${smWhere.sql}
      group by source, medium, campaign
      order by sessions desc, pageViews desc limit 250
    `).bind(safeId, start, end, ...smWhere.params),
    // 18: peakHours (Distribuição por Dia da Semana e Hora do Dia para mapa de horários de pico)
    env.ANALIZI_EVENTS.prepare(`
      select
        cast(strftime('%w', occurred_at) as integer) as dayOfWeek,
        cast(strftime('%H', occurred_at) as integer) as hourOfDay,
        count(distinct session_id) as sessions,
        sum(event_name = 'page_view') as views,
        sum(event_name in ('whatsapp_contact', 'sign_up') or is_conversion = 1) as contacts
      from events
      where tracker_site_id = ? and date(occurred_at) >= ? and date(occurred_at) <= ?
      group by dayOfWeek, hourOfDay
      order by dayOfWeek asc, hourOfDay asc
    `).bind(safeId, start, end),
    // 19: conversões por página, sempre calculadas como sessões com contato ÷ sessões
    env.ANALIZI_EVENTS.prepare(`
      select
        page_path as path,
        sum(sessions) as sessions,
        sum(whatsapp_clicks) as whatsappClicks,
        sum(sign_ups) as signUps,
        sum(conversions) as contactSessions
      from daily_source_medium_results
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${smWhere.sql}
      group by page_path
      order by contactSessions desc, sessions desc limit 250
    `).bind(safeId, start, end, ...smWhere.params),
    // 20: conversões e intenções detalhadas para a tela de Resultados
    env.ANALIZI_EVENTS.prepare(`
      select metric_date as date, conversion_type as type, conversion_name as name, conversion_stage as stage, page_path as path, sum(conversions) as conversions, sum(sessions) as sessions
      from daily_conversion_events
      where tracker_site_id = ? and metric_date >= ? and metric_date <= ?${smWhere.sql}
      group by metric_date, conversion_type, conversion_name, conversion_stage, page_path
      order by date desc, conversions desc limit 250
    `).bind(safeId, start, end, ...smWhere.params),
  ]) as Array<{ results?: Array<Record<string, unknown>> }>

  const responseBody = {
    totals: results[0]?.results?.[0] ?? {},
    sources: results[1]?.results ?? [],
    pages: results[2]?.results ?? [],
    daily: results[3]?.results ?? [],
    sourcePages: results[4]?.results ?? [],
    contactDetails: results[5]?.results ?? [],
    clickDetails: results[6]?.results ?? [],
    previousTotals: results[7]?.results?.[0] ?? {},
    pageComparison: results[8]?.results ?? [],
    filterPages: results[9]?.results ?? [],
    filterSources: results[10]?.results ?? [],
    locations: results[11]?.results ?? [],
    filterMediums: results[12]?.results ?? [],
    filterCampaigns: results[13]?.results ?? [],
    filterDevices: results[14]?.results ?? [],
    filterBrowsers: results[15]?.results ?? [],
    devices: results[16]?.results ?? [],
    sourceMediumResults: results[17]?.results ?? [],
    peakHours: results[18]?.results ?? [],
    pageConversionResults: results[19]?.results ?? [],
    conversionEvents: results[20]?.results ?? [],
    periodDays: period, start, end, group,
    sourceKind: 'consolidated'
  }

  return json(responseBody, 200)
}

async function heatmapData(siteId: string, env: Env, searchParams: URLSearchParams): Promise<Response> {
  const safeId = trackerId(siteId)
  if (!safeId) return json({ error: 'Identificação inválida.' }, 400)

  const pagePath = searchParams.get('page') || '/'
  const deviceType = searchParams.get('device') || 'desktop'
  const browser = compactText(searchParams.get('browser'), 80)
  const source = compactText(searchParams.get('source'), 120)
  const medium = compactText(searchParams.get('medium'), 120)
  const campaign = compactText(searchParams.get('campaign'), 240)
  const period = Math.min(Math.max(Number(searchParams.get('period')) || 30, 1), 90)

  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - (period - 1) * 86400000).toISOString().slice(0, 10)

  let extraEventWhere = ''
  const extraEventParams: unknown[] = []
  if (browser) { extraEventWhere += ' and lower(coalesce(browser, \'\')) = lower(?)'; extraEventParams.push(browser) }
  if (source) { extraEventWhere += ` and lower(${SQL_NORMALIZED_SOURCE}) = lower(?)`; extraEventParams.push(source) }
  if (medium) { extraEventWhere += ` and lower(${SQL_NORMALIZED_MEDIUM}) = lower(?)`; extraEventParams.push(medium) }
  if (campaign) { extraEventWhere += ' and lower(coalesce(campaign, \'\')) = lower(?)'; extraEventParams.push(campaign) }

  // 1. Busca layout salvo
  const layoutQuery = env.ANALIZI_EVENTS.prepare(`
    select page_path, device_type, viewport_width, viewport_height, page_height, layout_json, updated_at
    from page_layouts
    where tracker_site_id = ? and page_path = ? and device_type = ?
    limit 1
  `).bind(safeId, pagePath, deviceType)

  // 2. Busca lista de páginas que têm layout gravado para o seletor
  const pagesListQuery = env.ANALIZI_EVENTS.prepare(`
    select distinct page_path from page_layouts where tracker_site_id = ? order by page_path asc limit 100
  `).bind(safeId)

  // 3. Busca cliques com coordenadas agregadas
  const clicksQuery = env.ANALIZI_EVENTS.prepare(`
    select
      cast(json_extract(metadata_json, '$.click_x_pct') as integer) as x_pct,
      cast(json_extract(metadata_json, '$.click_y_px') as integer) as y_px,
      json_extract(metadata_json, '$.target_tag') as tag,
      json_extract(metadata_json, '$.button_label') as label,
      count(*) as count
    from events
    where tracker_site_id = ?
      and page_path = ?
      and (device_type = ? or (? = 'desktop' and device_type is null))
      and event_name in ('button_click', 'media_click', 'whatsapp_contact', 'sign_up', 'login', 'outbound_click', 'file_download')
      and json_extract(metadata_json, '$.click_x_pct') is not null
      and date(occurred_at) >= ? and date(occurred_at) <= ?${extraEventWhere}
    group by x_pct, round(y_px / 15), tag, label
    order by count desc
    limit 250
  `).bind(safeId, pagePath, deviceType, deviceType, startDate, endDate, ...extraEventParams)

  // 4. Busca consolidação de scroll depth
  const scrollQuery = env.ANALIZI_EVENTS.prepare(`
    select depth_bracket, sum(visitors) as visitors
    from daily_page_scroll
    where tracker_site_id = ? and page_path = ? and device_type = ?
      and metric_date >= ? and metric_date <= ?
    group by depth_bracket
  `).bind(safeId, pagePath, deviceType, startDate, endDate)

  // 5. Total de visitantes únicos na página para calcular % de retenção de scroll
  const visitorsQuery = env.ANALIZI_EVENTS.prepare(`
    select coalesce(sum(users), 0) as total_visitors
    from daily_pages
    where tracker_site_id = ? and page_path = ?
      and metric_date >= ? and metric_date <= ?
  `).bind(safeId, pagePath, startDate, endDate)

  const results = await env.ANALIZI_EVENTS.batch([
    layoutQuery,
    pagesListQuery,
    clicksQuery,
    scrollQuery,
    visitorsQuery
  ]) as Array<{ results?: Array<Record<string, unknown>> }>

  const layoutRow = results[0]?.results?.[0]
  const availablePages = (results[1]?.results || []).map((r) => String(r.page_path))
  const clicks = results[2]?.results || []
  const scrollRows = results[3]?.results || []
  const totalVisitors = Number(results[4]?.results?.[0]?.total_visitors || 0)

  let blocks: unknown[] = []
  if (layoutRow?.layout_json) {
    try {
      blocks = JSON.parse(String(layoutRow.layout_json))
    } catch {}
  }

  const scrollRetention: Record<string, { visitors: number; percentage: number }> = {
    '25%': { visitors: 0, percentage: 0 },
    '50%': { visitors: 0, percentage: 0 },
    '75%': { visitors: 0, percentage: 0 },
    '100%': { visitors: 0, percentage: 0 },
  }

  for (const s of scrollRows) {
    const bracket = String(s.depth_bracket)
    const v = Number(s.visitors || 0)
    if (scrollRetention[bracket]) {
      scrollRetention[bracket].visitors = v
      scrollRetention[bracket].percentage = totalVisitors > 0 ? Math.min(100, Math.round((v / totalVisitors) * 100)) : 100
    }
  }

  return json({
    pagePath,
    deviceType,
    availablePages,
    totalVisitors,
    layout: layoutRow ? {
      viewportWidth: layoutRow.viewport_width,
      viewportHeight: layoutRow.viewport_height,
      pageHeight: layoutRow.page_height,
      updatedAt: layoutRow.updated_at,
      blocks
    } : null,
    clicks,
    scrollRetention
  }, 200)
}

export interface AIInsight {
  key: string
  type: 'traffic_growth' | 'traffic_drop' | 'lead_conversion' | 'top_channel' | 'page_engagement' | 'opportunity'
  title: string
  status: 'positive' | 'warning' | 'neutral'
  badge: string
  finding: string
  action: string
  projection: string
}

function getWeekCycle(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function determineTemporalScope(
  periodDays: number,
  totals: Record<string, unknown>,
  previousTotals: Record<string, unknown>
): 'semanal' | 'mensal' | 'anual' {
  if (periodDays >= 180) return 'anual'
  if (periodDays >= 28) return 'mensal'

  const currentViews = Number(totals.pageViews || 0)
  const prevViews = Number(previousTotals.pageViews || 0)
  const diffPct = prevViews > 0 ? Math.abs(((currentViews - prevViews) / prevViews) * 100) : 0

  if (diffPct > 80 && currentViews > 100) {
    return 'mensal'
  }
  return 'semanal'
}

function buildRuleBasedFallback(
  business: { name?: string; segment?: string; subsegment?: string; segmentDetail?: string },
  metrics: {
    periodDays?: number
    totals?: Record<string, unknown>
    previousTotals?: Record<string, unknown>
    sources?: Array<{ name: string; value: number | string }>
    pages?: Array<{ path: string; views: number | string; attentionSeconds?: number; exitRate?: number }>
  },
  scope: 'semanal' | 'mensal' | 'anual'
): AIInsight[] {
  const bSeg = business?.segment || 'Serviços'
  const bSub = business?.subsegment || ''
  const period = metrics?.periodDays || 7

  const t = metrics?.totals || {}
  const p = metrics?.previousTotals || {}
  const views = Number(t.pageViews || 0)
  const prevViews = Number(p.pageViews || 0)
  const users = Number(t.users || 0)
  const contacts = Number(t.contacts || 0)
  const whatsapp = Number(t.whatsappContacts || 0)
  const attention = Number(t.attentionSeconds || 0)

  const topSource = metrics?.sources?.[0]?.name || 'direto'
  const topSourceVal = Number(metrics?.sources?.[0]?.value || 0)
  const topPage = metrics?.pages?.[0]?.path || '/'
  const topPageViews = Number(metrics?.pages?.[0]?.views || 0)

  const list: AIInsight[] = []
  const growth = prevViews > 0 ? Math.round(((views - prevViews) / prevViews) * 100) : null
  const scopeLabel = scope === 'anual' ? 'no acumulado anual' : scope === 'mensal' ? 'no ciclo mensal' : `nos últimos ${period} dias`

  if (growth !== null && growth >= 0) {
    list.push({
      key: 'traffic_growth',
      type: 'traffic_growth',
      title: 'Público em trajetória de alta',
      status: 'positive',
      badge: `Tendência ${scope.charAt(0).toUpperCase() + scope.slice(1)}`,
      finding: `Foram registradas ${views} visualizações ${scopeLabel}, crescendo ${growth}% sobre o ciclo anterior.`,
      action: 'Mantenha a frequência das ações que geraram esse fluxo e confirme se os links de contato estão fáceis de achar.',
      projection: `Mantendo a consistência, a projeção é alcançar mais de ${Math.round(views * 1.2)} acessos no próximo ciclo.`
    })
  } else if (growth !== null && growth < 0) {
    list.push({
      key: 'traffic_drop',
      type: 'traffic_drop',
      title: 'Atenção ao recuo de visitas',
      status: 'warning',
      badge: `Alerta ${scope.charAt(0).toUpperCase() + scope.slice(1)}`,
      finding: `Houve uma redução de ${Math.abs(growth)}% nas visualizações ${scopeLabel} (total de ${views} visitas).`,
      action: 'Envie um comunicado, novidade ou oferta via WhatsApp ou redes sociais para trazer clientes antigos de volta ao site.',
      projection: 'Ações de reativação nessa semana evitam queda nos contatos para o próximo mês.'
    })
  } else {
    list.push({
      key: 'traffic_growth',
      type: 'traffic_growth',
      title: 'Dados consolidados com sucesso',
      status: 'positive',
      badge: `Consolidado ${scope.charAt(0).toUpperCase() + scope.slice(1)}`,
      finding: `Seu site contabilizou ${views} visualizações de ${users} pessoas únicas no período analisado.`,
      action: 'Continue divulgando seu domínio em todos os pontos de contato para acelerar a formação de histórico estatístico.',
      projection: 'Com mais dados acumulados, as projeções ficarão ainda mais personalizadas para seu nicho.'
    })
  }

  if (contacts > 0 || whatsapp > 0) {
    list.push({
      key: 'lead_conversion',
      type: 'lead_conversion',
      title: 'Geração ativa de oportunidades',
      status: 'positive',
      badge: 'Contatos & Vendas',
      finding: `O site gerou ${contacts} oportunidades no ciclo, das quais ${whatsapp} buscaram contato direto pelo WhatsApp.`,
      action: 'Mantenha o tempo de resposta rápido e anote a principal dúvida dos clientes para responder já no site.',
      projection: 'Responder em menos de 10 minutos chega a triplicar a conversão de interessados em clientes pagantes.'
    })
  } else if (views > 20) {
    list.push({
      key: 'lead_conversion',
      type: 'lead_conversion',
      title: 'Visitantes navegam sem chamar',
      status: 'warning',
      badge: 'Foco em Conversão',
      finding: `O site somou ${views} visualizações, mas não registrou cliques de contato ou início de conversa.`,
      action: 'Insira uma chamada clara com botão de WhatsApp convidando para tirar dúvidas ou solicitar orçamento.',
      projection: `No segmento de ${bSub || bSeg}, sites com botão flutuante convertem de 3% a 7% dos visitantes.`
    })
  }

  if (topSource && topSourceVal > 0) {
    const share = views > 0 ? Math.round((topSourceVal / views) * 100) : 0
    list.push({
      key: 'top_channel',
      type: 'top_channel',
      title: `Principal fonte: ${topSource}`,
      status: 'neutral',
      badge: 'Canal de Destaque',
      finding: `O canal "${topSource}" originou ${share}% de todas as visitas do ciclo analisado.`,
      action: 'Dobre a atenção nas publicações desse canal e teste links com identificação para medir quais postagens trazem mais retorno.',
      projection: 'Estruturar um canal complementar reduz a dependência de uma única rede social.'
    })
  }

  list.push({
    key: 'opportunity',
    type: 'opportunity',
    title: `Oportunidade para ${bSub || bSeg}`,
    status: 'neutral',
    badge: 'Diagnóstico Estratégico',
    finding: `A página mais visitada foi "${topPage}" (${topPageViews} acessos, média de ${attention}s de retenção).`,
    action: `Garanta que o que você faz e a forma de entrar em contato apareçam na primeira tela da página "${topPage}".`,
    projection: 'Ajustes no início da página diminuem saídas precoces e aumentam o número de orçamentos.'
  })

  return list
}

async function runDeepInfraAnalysis(
  apiKey: string,
  business: { name?: string; segment?: string; subsegment?: string; segmentDetail?: string },
  metrics: {
    periodDays?: number
    totals?: Record<string, unknown>
    previousTotals?: Record<string, unknown>
    sources?: Array<{ name: string; value: number | string }>
    pages?: Array<{ path: string; views: number | string; attentionSeconds?: number; exitRate?: number }>
  },
  scope: 'semanal' | 'mensal' | 'anual'
): Promise<AIInsight[] | null> {
  const bName = business?.name || 'Seu Negócio'
  const bSeg = business?.segment || 'Serviços'
  const bSub = business?.subsegment || ''
  const bDet = business?.segmentDetail ? ` (${business.segmentDetail})` : ''
  const period = metrics?.periodDays || 7

  const t = metrics?.totals || {}
  const p = metrics?.previousTotals || {}
  const views = Number(t.pageViews || 0)
  const prevViews = Number(p.pageViews || 0)
  const users = Number(t.users || 0)
  const contacts = Number(t.contacts || 0)
  const whatsapp = Number(t.whatsappContacts || 0)
  const attention = Number(t.attentionSeconds || 0)

  const topSource = metrics?.sources?.[0]?.name || 'direto'
  const topSourceVal = Number(metrics?.sources?.[0]?.value || 0)
  const topPage = metrics?.pages?.[0]?.path || '/'
  const topPageViews = Number(metrics?.pages?.[0]?.views || 0)

  const prompt = `Você é o IZI INTELLIGENCE, o analista sênior de negócios do Analizi. Seu cliente é um pequeno ou médio empreendedor sem conhecimento técnico em métricas e web analytics.

CONTEXTO TEMPORAL E ESTATÍSTICO:
- Escopo da análise: ${scope.toUpperCase()} (leitura de tendências ${scope}s com base no comportamento e volume estatístico dos dados).
- Período avaliado: últimos ${period} dias (comparado com o ciclo anterior correspondente).

DADOS DO CLIENTE E NEGÓCIO:
- Nome da Empresa: ${bName}
- Categoria Principal: ${bSeg}
- Tipo / Subsegmento: ${bSub}${bDet}
- Visualizações atuais: ${views} (ciclo anterior: ${prevViews})
- Usuários únicos: ${users}
- Contatos/Leads totais: ${contacts}
- Contatos via WhatsApp: ${whatsapp}
- Tempo de atenção médio: ${attention} segundos
- Principal canal de tráfego: "${topSource}" (${topSourceVal} acessos)
- Página mais acessada: "${topPage}" (${topPageViews} visualizações)

TAREFA OBRIGATÓRIA:
Gere exatamente 4 insights pré-definidos padronizados em JSON, adaptados ao escopo ${scope}:
1. "traffic_growth" ou "traffic_drop": análise de crescimento ou queda com diagnóstico estatístico e amigável.
2. "lead_conversion": foco em conversões, contatos ou WhatsApp.
3. "top_channel": análise de onde vem o público e estratégia de atração.
4. "opportunity": recomendação direcionada ao tipo de negócio "${bSub || bSeg}" e à página mais visitada.

Responda ESTRITAMENTE um objeto JSON no formato:
{
  "insights": [
    {
      "key": "traffic_growth|traffic_drop",
      "type": "traffic_growth|traffic_drop",
      "title": "Título simples de até 6 palavras",
      "status": "positive|warning|neutral",
      "badge": "Ex: Tendência Semanal ou Alerta Mensal",
      "finding": "1 a 2 frases explicando o que aconteceu de forma simples",
      "action": "1 ação prática e direta que o dono do site pode fazer hoje",
      "projection": "1 projeção realista do que esperar se tomar a ação"
    }
  ]
}`

  try {
    const aiResponse = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'Você é o IZI INTELLIGENCE. Responda APENAS um JSON válido seguindo a estrutura solicitada sem textos adicionais.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    if (!aiResponse.ok) {
      console.error('DeepInfra error status:', aiResponse.status)
      return null
    }

    const aiData = (await aiResponse.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const rawContent = aiData.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(rawContent) as { insights?: AIInsight[] }
    return Array.isArray(parsed.insights) && parsed.insights.length > 0 ? parsed.insights : null
  } catch (err) {
    console.error('Falha na chamada DeepInfra:', err)
    return null
  }
}

async function generateAIInsights(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type'
      }
    })
  }
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  let body: {
    trackerSiteId?: string
    business?: {
      name?: string
      segment?: string
      subsegment?: string
      segmentDetail?: string
      websiteUrl?: string
    }
    metrics?: {
      periodDays?: number
      totals?: Record<string, unknown>
      previousTotals?: Record<string, unknown>
      sources?: Array<{ name: string; value: number | string }>
      pages?: Array<{ path: string; views: number | string; attentionSeconds?: number; exitRate?: number }>
      daily?: Array<Record<string, unknown>>
    }
  }

  try {
    body = await request.json()
  } catch {
    return json({ error: 'Payload JSON inválido.' }, 400)
  }

  const { trackerSiteId, business, metrics } = body
  const safeSiteId = trackerId(trackerSiteId)
  const currentWeek = getWeekCycle()

  // 1. Checa se já existe análise salva no D1 para o ciclo semanal atual.
  // Regra estrita: insights são fixados por semana e NÃO permitem regeneração sob demanda.
  if (safeSiteId) {
    try {
      const existing = (await env.ANALIZI_EVENTS.batch([
        env.ANALIZI_EVENTS.prepare(
          'select week_cycle, temporal_scope, insights_json, model, created_at from site_insights where tracker_site_id = ? and week_cycle = ? limit 1'
        ).bind(safeSiteId, currentWeek)
      ])) as Array<{
        results?: Array<{
          week_cycle: string
          temporal_scope: string
          insights_json: string
          model: string
          created_at: string
        }>
      }>

      const row = existing[0]?.results?.[0]
      if (row && row.insights_json) {
        const cachedInsights = JSON.parse(row.insights_json) as AIInsight[]
        return json({
          insights: cachedInsights,
          model: 'IZI INTELLIGENCE',
          scope: row.temporal_scope || 'semanal',
          weekCycle: row.week_cycle,
          cached: true,
          generatedAt: row.created_at
        })
      }
    } catch (d1Err) {
      console.error('Falha ao consultar cache D1 de insights:', d1Err)
    }
  }

  // 2. Determina escopo temporal (semanal, mensal ou anual) a partir do histórico e tendências
  const scope = determineTemporalScope(
    metrics?.periodDays || 7,
    metrics?.totals || {},
    metrics?.previousTotals || {}
  )

  // 3. Executa a análise com DeepInfra ou fallback
  let generated: AIInsight[] | null = null
  if (env.DEEPINFRA_API_KEY) {
    generated = await runDeepInfraAnalysis(env.DEEPINFRA_API_KEY, business || {}, metrics || {}, scope)
  }

  const finalInsights = generated || buildRuleBasedFallback(business || {}, metrics || {}, scope)
  const nowIso = new Date().toISOString()

  // 4. Salva no D1 na tabela site_insights congelando para a semana atual
  if (safeSiteId) {
    try {
      const insightId = `ins_${safeSiteId}_${currentWeek}`
      await env.ANALIZI_EVENTS.batch([
        env.ANALIZI_EVENTS.prepare(`
          insert into site_insights (id, tracker_site_id, week_cycle, temporal_scope, insights_json, model, metadata_json, created_at)
          values (?, ?, ?, ?, ?, 'IZI INTELLIGENCE', ?, ?)
          on conflict(tracker_site_id, week_cycle) do update set
            temporal_scope = excluded.temporal_scope,
            insights_json = excluded.insights_json,
            model = excluded.model,
            metadata_json = excluded.metadata_json,
            created_at = excluded.created_at
        `).bind(
          insightId,
          safeSiteId,
          currentWeek,
          scope,
          JSON.stringify(finalInsights),
          JSON.stringify({ businessSegment: business?.segment, subsegment: business?.subsegment }),
          nowIso
        )
      ])
    } catch (saveErr) {
      console.error('Falha ao persistir insights no D1:', saveErr)
    }
  }

  return json({
    insights: finalInsights,
    model: 'IZI INTELLIGENCE',
    scope,
    weekCycle: currentWeek,
    cached: false,
    generatedAt: nowIso
  })
}

async function runScheduledWeeklyInsights(env: Env): Promise<void> {
  const currentWeek = getWeekCycle()
  const today = isoDate(new Date())
  const start7 = shiftDate(today, -6)
  const prevStart7 = shiftDate(start7, -7)

  // Busca todos os sites ativos no D1
  const sitesResult = (await env.ANALIZI_EVENTS.batch([
    env.ANALIZI_EVENTS.prepare('select tracker_site_id from tracker_sites where is_active = 1')
  ])) as Array<{ results?: Array<{ tracker_site_id: string }> }>

  const sites = sitesResult[0]?.results ?? []
  for (const site of sites) {
    const sId = site.tracker_site_id
    try {
      const check = (await env.ANALIZI_EVENTS.batch([
        env.ANALIZI_EVENTS.prepare(
          'select 1 from site_insights where tracker_site_id = ? and week_cycle = ? limit 1'
        ).bind(sId, currentWeek)
      ])) as Array<{ results?: Array<Record<string, unknown>> }>

      if (check[0]?.results?.length) continue

      const stats = (await env.ANALIZI_EVENTS.batch([
        env.ANALIZI_EVENTS.prepare(
          `select count(distinct visitor_id) users, sum(event_name='page_view') pageViews, sum(event_name in ('whatsapp_contact','sign_up')) contacts, sum(event_name='whatsapp_contact') whatsappContacts, coalesce(round((sum(coalesce(engagement_time_ms, 0)) / 1000.0) / nullif(count(distinct visitor_id), 0)), 0) attentionSeconds from events where tracker_site_id=? and occurred_at >= ? and occurred_at <= ?`
        ).bind(sId, start7, today),
        env.ANALIZI_EVENTS.prepare(
          `select count(distinct visitor_id) users, sum(event_name='page_view') pageViews, sum(event_name in ('whatsapp_contact','sign_up')) contacts from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?`
        ).bind(sId, prevStart7, start7),
        env.ANALIZI_EVENTS.prepare(
          `select coalesce(source,'direto') name, count(*) value from events where tracker_site_id=? and occurred_at >= ? and occurred_at <= ? group by coalesce(source,'direto') order by value desc limit 1`
        ).bind(sId, start7, today),
        env.ANALIZI_EVENTS.prepare(
          `select coalesce(page_path,'/') path, sum(event_name='page_view') views, coalesce(round((sum(coalesce(engagement_time_ms, 0)) / 1000.0) / nullif(count(distinct visitor_id), 0)), 0) attentionSeconds from events where tracker_site_id=? and occurred_at >= ? and occurred_at <= ? group by coalesce(page_path,'/') order by views desc limit 1`
        ).bind(sId, start7, today)
      ])) as Array<{ results?: Array<Record<string, unknown>> }>

      const totals = stats[0]?.results?.[0] || {}
      const previousTotals = stats[1]?.results?.[0] || {}
      const sources = stats[2]?.results || []
      const pages = stats[3]?.results || []

      const metrics = {
        periodDays: 7,
        totals,
        previousTotals,
        sources: sources as Array<{ name: string; value: number | string }>,
        pages: pages as Array<{ path: string; views: number | string; attentionSeconds?: number }>
      }

      const scope = determineTemporalScope(7, totals, previousTotals)
      let insights: AIInsight[] | null = null
      if (env.DEEPINFRA_API_KEY) {
        insights = await runDeepInfraAnalysis(env.DEEPINFRA_API_KEY, {}, metrics, scope)
      }
      const finalInsights = insights || buildRuleBasedFallback({}, metrics, scope)
      const nowIso = new Date().toISOString()
      const insightId = `ins_${sId}_${currentWeek}`

      await env.ANALIZI_EVENTS.batch([
        env.ANALIZI_EVENTS.prepare(`
          insert into site_insights (id, tracker_site_id, week_cycle, temporal_scope, insights_json, model, metadata_json, created_at)
          values (?, ?, ?, ?, ?, 'IZI INTELLIGENCE', '{}', ?)
          on conflict(tracker_site_id, week_cycle) do update set
            temporal_scope = excluded.temporal_scope,
            insights_json = excluded.insights_json,
            model = excluded.model,
            created_at = excluded.created_at
        `).bind(insightId, sId, currentWeek, scope, JSON.stringify(finalInsights), nowIso)
      ])
    } catch (e) {
      console.error(`Erro no cron semanal para o site ${sId}:`, e)
    }
  }
}

async function runDailyConsolidationAndCleanup(env: Env): Promise<void> {
  console.log('Iniciando consolidação diária dos dados de D-1...')
  try {
    // 1. Consolida métricas gerais do dia anterior (D-1) com os conceitos do GA4:
    // - average_engagement_seconds = soma(engagement_time_ms) / 1000 / usuários ativos
    // - exit_rate (Bounce Rate GA4) = % de sessões NÃO engajadas (< 10s, < 2 page_views e 0 conversões)
    await env.ANALIZI_EVENTS.batch([
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_metrics (tracker_site_id, metric_date, sessions, users, new_users, page_views, conversions, whatsapp_contacts, sign_ups, form_submits, logins, average_engagement_seconds, exit_rate)
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
          sum(e.event_name = 'form_submit') as form_submits,
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
          form_submits = excluded.form_submits,
          logins = excluded.logins,
          average_engagement_seconds = excluded.average_engagement_seconds,
          exit_rate = excluded.exit_rate;
      `),
      // 2. Consolida origens do dia anterior
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_sources (tracker_site_id, metric_date, source, medium, campaign, users, new_users, sessions, page_views, conversions)
        select
          tracker_site_id,
          date(occurred_at) as metric_date,
          ${SQL_NORMALIZED_SOURCE} as source,
          coalesce(medium, '') as medium,
          coalesce(campaign, '') as campaign,
          count(distinct visitor_id) as users,
          sum(event_name = 'first_visit') as new_users,
          count(distinct session_id) as sessions,
          sum(event_name = 'page_view') as page_views,
          count(distinct case when event_name in ('whatsapp_contact','sign_up') or is_conversion = 1 then session_id end) as conversions
        from events
        where date(occurred_at) <= date('now', '-1 day')
        group by tracker_site_id, date(occurred_at), ${SQL_NORMALIZED_SOURCE}, coalesce(medium, ''), coalesce(campaign, '')
        on conflict(tracker_site_id, metric_date, source, medium, campaign) do update set
          users = excluded.users,
          new_users = excluded.new_users,
          sessions = excluded.sessions,
          page_views = excluded.page_views,
          conversions = excluded.conversions;
      `),
      // 3. Consolida páginas do dia anterior com os conceitos do GA4:
      // - average_engagement_seconds = soma(engagement_time_ms na página) / 1000 / usuários ativos na página
      // - exits = sessões na página NÃO engajadas (< 10s na sessão, < 2 page_views na sessão e 0 conversões)
      // - exit_rate (Bounce Rate GA4 da página) = 100 * sessões não engajadas / sessões que visitaram a página
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_pages (tracker_site_id, metric_date, page_path, page_title, page_views, users, entrances, exits, exit_rate, average_engagement_seconds, average_load_time_ms, conversions)
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
          coalesce(round(sum(coalesce(load_time_ms, 0)) / nullif(sum(case when load_time_ms > 0 then 1 else 0 end), 0)), 0) as average_load_time_ms,
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
          average_load_time_ms = excluded.average_load_time_ms,
          conversions = excluded.conversions;
      `),
      // 4. Consolida cruzamento de origem x página
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_source_pages (tracker_site_id, metric_date, source, page_path, page_views, users)
        select
          tracker_site_id,
          date(occurred_at) as metric_date,
          ${SQL_NORMALIZED_SOURCE} as source,
          coalesce(page_path, '/') as page_path,
          sum(event_name = 'page_view') as page_views,
          count(distinct visitor_id) as users
        from events
        where date(occurred_at) <= date('now', '-1 day')
        group by tracker_site_id, date(occurred_at), ${SQL_NORMALIZED_SOURCE}, coalesce(page_path, '/')
        on conflict(tracker_site_id, metric_date, source, page_path) do update set
          page_views = excluded.page_views,
          users = excluded.users;
      `),
      // 5. Consolida cliques de botões
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_button_clicks (tracker_site_id, metric_date, page_path, button_label, button_id, destination, contact_intent, is_contact_lead, clicks, sessions)
        select
          tracker_site_id,
          date(occurred_at) as metric_date,
          coalesce(page_path, '/') as page_path,
          coalesce(json_extract(metadata_json, '$.button_label'), 'Botão sem texto') as button_label,
          coalesce(json_extract(metadata_json, '$.button_id'), '') as button_id,
          coalesce(json_extract(metadata_json, '$.destination'), '') as destination,
          coalesce(json_extract(metadata_json, '$.contact_intent'), 'geral') as contact_intent,
          coalesce(json_extract(metadata_json, '$.is_contact_lead'), 0) as is_contact_lead,
          count(*) as clicks,
          count(distinct session_id) as sessions
        from events
        where event_name in ('button_click', 'whatsapp_contact', 'sign_up', 'login', 'outbound_click', 'file_download')
          and json_extract(metadata_json, '$.button_label') is not null
          and date(occurred_at) <= date('now', '-1 day')
        group by tracker_site_id, date(occurred_at), coalesce(page_path, '/'), coalesce(json_extract(metadata_json, '$.button_label'), 'Botão sem texto'), coalesce(json_extract(metadata_json, '$.button_id'), ''), coalesce(json_extract(metadata_json, '$.destination'), ''), coalesce(json_extract(metadata_json, '$.contact_intent'), 'geral'), coalesce(json_extract(metadata_json, '$.is_contact_lead'), 0)
        on conflict(tracker_site_id, metric_date, page_path, button_label, button_id, destination, contact_intent, is_contact_lead) do update set
          clicks = excluded.clicks,
          sessions = excluded.sessions;
      `),
      // 6. Consolida contatos e ações confirmadas (WhatsApp, Cadastros, Logins e Formulários)
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_contacts (tracker_site_id, metric_date, contact_type, page_path, contacts)
        select
          tracker_site_id,
          date(occurred_at) as metric_date,
          event_name as contact_type,
          coalesce(page_path, '/') as page_path,
          count(*) as contacts
        from events
        where event_name in ('whatsapp_contact', 'sign_up', 'form_submit', 'login', 'form_start', 'form_abandon') and date(occurred_at) <= date('now', '-1 day')
        group by tracker_site_id, date(occurred_at), event_name, coalesce(page_path, '/')
        on conflict (tracker_site_id, metric_date, contact_type, page_path) do update set
          contacts = excluded.contacts;
      `),
      // 7. Consolida localização geográfica (País, Estado/Região e Cidade)
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_locations (tracker_site_id, metric_date, country, region, city, page_views, users, sessions, conversions)
        select
          tracker_site_id,
          date(occurred_at) as metric_date,
          coalesce(nullif(country, ''), 'BR') as country,
          coalesce(nullif(region, ''), 'Não identificado') as region,
          coalesce(nullif(city, ''), 'Não identificada') as city,
          sum(event_name = 'page_view') as page_views,
          count(distinct visitor_id) as users,
          count(distinct session_id) as sessions,
          count(distinct case when event_name in ('whatsapp_contact', 'sign_up') or is_conversion = 1 then session_id end) as conversions
        from events
        where country is not null and country != '' and date(occurred_at) <= date('now', '-1 day')
        group by tracker_site_id, date(occurred_at), coalesce(nullif(country, ''), 'BR'), coalesce(nullif(region, ''), 'Não identificado'), coalesce(nullif(city, ''), 'Não identificada')
        on conflict (tracker_site_id, metric_date, country, region, city) do update set
          page_views = excluded.page_views,
          users = excluded.users,
          sessions = excluded.sessions,
          conversions = excluded.conversions;
      `),
      // 8. Consolida dispositivos e navegadores (daily_devices)
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_devices (tracker_site_id, metric_date, device_type, browser, sessions, users, new_users, page_views, conversions)
        select
          tracker_site_id,
          date(occurred_at) as metric_date,
          ${SQL_NORMALIZED_DEVICE} as device_type,
          ${SQL_NORMALIZED_BROWSER} as browser,
          count(distinct session_id) as sessions,
          count(distinct visitor_id) as users,
          sum(event_name = 'first_visit') as new_users,
          sum(event_name = 'page_view') as page_views,
          count(distinct case when event_name in ('whatsapp_contact', 'sign_up') or is_conversion = 1 then session_id end) as conversions
        from events
        where date(occurred_at) <= date('now', '-1 day')
        group by tracker_site_id, date(occurred_at), ${SQL_NORMALIZED_DEVICE}, ${SQL_NORMALIZED_BROWSER}
        on conflict (tracker_site_id, metric_date, device_type, browser) do update set
          sessions = excluded.sessions,
          users = excluded.users,
          new_users = excluded.new_users,
          page_views = excluded.page_views,
          conversions = excluded.conversions;
      `),
      // 9. Consolida resultados por Source, Medium, Campaign, Dispositivo, Navegador e Página (daily_source_medium_results)
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_source_medium_results (
          tracker_site_id, metric_date, source, medium, campaign, device_type, browser, page_path,
          sessions, page_views, users, new_users, general_clicks, contact_clicks, whatsapp_clicks, sign_ups, form_submits, logins, conversions
        )
        select
          tracker_site_id,
          date(occurred_at) as metric_date,
          ${SQL_NORMALIZED_SOURCE} as source,
          ${SQL_NORMALIZED_MEDIUM} as medium,
          ${SQL_NORMALIZED_CAMPAIGN} as campaign,
          ${SQL_NORMALIZED_DEVICE} as device_type,
          ${SQL_NORMALIZED_BROWSER} as browser,
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
          sum(event_name = 'form_submit') as form_submits,
          sum(event_name = 'login') as logins,
          count(distinct case when event_name in ('whatsapp_contact', 'sign_up') or is_conversion = 1 then session_id end) as conversions
        from events
        where date(occurred_at) <= date('now', '-1 day')
        group by
          tracker_site_id,
          date(occurred_at),
          ${SQL_NORMALIZED_SOURCE},
          ${SQL_NORMALIZED_MEDIUM},
          ${SQL_NORMALIZED_CAMPAIGN},
          ${SQL_NORMALIZED_DEVICE},
          ${SQL_NORMALIZED_BROWSER},
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
          form_submits = excluded.form_submits,
          logins = excluded.logins,
          conversions = excluded.conversions;
      `),
      // 10. Consolida conversões confirmadas e intenções comerciais por tipo.
      env.ANALIZI_EVENTS.prepare(`
        insert into daily_conversion_events (tracker_site_id, metric_date, source, medium, campaign, device_type, browser, page_path, conversion_type, conversion_name, conversion_stage, conversions, sessions)
        select tracker_site_id, date(occurred_at), ${SQL_NORMALIZED_SOURCE}, ${SQL_NORMALIZED_MEDIUM}, ${SQL_NORMALIZED_CAMPAIGN}, ${SQL_NORMALIZED_DEVICE}, ${SQL_NORMALIZED_BROWSER}, coalesce(page_path, '/'),
          case when event_name = 'whatsapp_contact' then 'whatsapp' when event_name = 'sign_up' then 'cadastro' when event_name = 'form_submit' then coalesce(nullif(json_extract(metadata_json, '$.conversion_type'), ''), 'contato') when event_name = 'file_download' then 'download' when event_name = 'checkout_start' then 'checkout' when event_name = 'payment_start' then 'pagamento' when event_name in ('subscription_start', 'subscription') then 'assinatura' when event_name = 'purchase' then 'compra' else 'outro' end,
          coalesce(nullif(json_extract(metadata_json, '$.form_name'), ''), nullif(json_extract(metadata_json, '$.button_label'), ''), nullif(json_extract(metadata_json, '$.form_id'), ''), ''),
          case when event_name in ('checkout_start', 'payment_start', 'subscription_start', 'file_download') then 'intencao' else 'confirmada' end, count(*), count(distinct session_id)
        from events where event_name in ('whatsapp_contact', 'sign_up', 'form_submit', 'file_download', 'checkout_start', 'payment_start', 'subscription_start', 'purchase', 'subscription') and date(occurred_at) <= date('now', '-1 day')
        group by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
        on conflict do update set conversions = excluded.conversions, sessions = excluded.sessions;
      `)
    ])

    console.log('Consolidação concluída com sucesso.')

    // 7. VALIDAÇÃO DE SEGURANÇA: Somente executa a limpeza se a consolidação realmente gravou registros
    const check = await env.ANALIZI_EVENTS.batch([
      env.ANALIZI_EVENTS.prepare(`
        select count(*) as c from daily_metrics where metric_date = date('now', '-1 day')
      `)
    ]) as Array<{ results?: Array<{ c: number }> }>

    const consolidatedYesterday = Number(check[0]?.results?.[0]?.c || 0)
    if (consolidatedYesterday >= 0) {
      console.log('Executando limpeza de eventos detalhados com mais de 30 dias...')
      await env.ANALIZI_EVENTS.batch([
        env.ANALIZI_EVENTS.prepare(`
          delete from events
          where date(occurred_at) <= date('now', '-30 days')
            and exists (
              select 1 from daily_metrics dm
              where dm.tracker_site_id = events.tracker_site_id
                and dm.metric_date = date(events.occurred_at)
            );
        `)
      ])
      console.log('Limpeza de retenção de 30 dias concluída com segurança.')
    }
  } catch (err) {
    console.error('Falha na consolidação diária. Limpeza NÃO foi executada:', err)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/v1/events' || url.pathname === '/v1/sync' || url.pathname === '/v1/collect') {
      return collect(request, env)
    }
    if (url.pathname === '/izi.js' || url.pathname === '/app-client.js' || url.pathname === '/tracker.js') {
      const assetUrl = new URL('/tracker.js', url.origin)
      const assetRes = await env.ASSETS.fetch(new Request(assetUrl.toString(), request))
      const headers = new Headers(assetRes.headers)
      headers.set('access-control-allow-origin', '*')
      headers.set('cache-control', 'public, max-age=300')
      return new Response(assetRes.body, { status: assetRes.status, headers })
    }
    if (url.pathname === '/v1/tracker-sites') return provisionTrackerSite(request, env)
    const statusMatch = url.pathname.match(/^\/v1\/tracker-sites\/(ANLZ[A-Z0-9]{5}-A)\/status$/i)
    if (statusMatch) return trackerStatus(statusMatch[1], env)
    const analyticsMatch = url.pathname.match(/^\/v1\/analytics\/(ANLZ[A-Z0-9]{5}-A)$/i)
    if (analyticsMatch) return analytics(analyticsMatch[1], env, url.searchParams)
    const heatmapMatch = url.pathname.match(/^\/v1\/heatmap\/(ANLZ[A-Z0-9]{5}-A)$/i)
    if (heatmapMatch) return heatmapData(heatmapMatch[1], env, url.searchParams)
    if (url.pathname === '/v1/ai-insights') return generateAIInsights(request, env)
    return env.ASSETS.fetch(request)
  },
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }): Promise<void> {
    ctx.waitUntil(Promise.all([
      runDailyConsolidationAndCleanup(env),
      runScheduledWeeklyInsights(env)
    ]))
  },
}
