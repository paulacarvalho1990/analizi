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
}

const ALLOWED_EVENTS = new Set([
  'page_view',
  'session_start',
  'first_visit',
  'button_click',
  'sign_up',
  'login',
  'whatsapp_contact',
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
  deviceType?: string
  browser?: string
  operatingSystem?: string
  language?: string
  engagementTimeMs?: number
  isConversion?: boolean
  metadata?: Record<string, unknown>
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
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
  if (size > 24_000) return json({ error: 'Evento muito grande.' }, 413)

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
  for (const event of events) {
    const name = compactText(event.eventName, 40)
    if (!ALLOWED_EVENTS.has(name)) continue
    const id = compactText(event.id, 64)
    const visitorId = compactText(event.visitorId, 80)
    const sessionId = compactText(event.sessionId, 80)
    if (!id || !visitorId || !sessionId) continue
    statements.push(env.ANALIZI_EVENTS.prepare(`
      insert into events (
        id, tracker_site_id, occurred_at, received_at, event_name, visitor_id, session_id, session_number,
        page_path, page_title, page_url, page_hostname, referrer_host, referrer_url,
        source, medium, campaign, device_type, browser, operating_system, language,
        engagement_time_ms, is_conversion, metadata_json
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, compactText(event.occurredAt, 40) || new Date().toISOString(), new Date().toISOString(), name, visitorId, sessionId,
      Number.isInteger(event.sessionNumber) ? event.sessionNumber : null,
      compactText(event.pagePath, 1_024) || null, compactText(event.pageTitle, 512) || null,
      compactText(event.pageUrl, 2_048) || null, compactText(event.pageHostname, 253) || null,
      compactText(event.referrerHost, 253) || null, compactText(event.referrerUrl, 2_048) || null,
      compactText(event.source, 120) || null, compactText(event.medium, 120), compactText(event.campaign, 240),
      compactText(event.deviceType, 32) || null, compactText(event.browser, 80) || null,
      compactText(event.operatingSystem, 80) || null, compactText(event.language, 35) || null,
      Number.isFinite(event.engagementTimeMs) ? Math.max(0, Math.min(Number(event.engagementTimeMs), 3_600_000)) : null,
      event.isConversion ? 1 : 0, safeMetadata(event.metadata),
    ))
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
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } })
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  let payload: { trackerSiteId?: unknown, domain?: unknown, supabaseSiteId?: unknown, businessId?: unknown }
  try { payload = await request.json() } catch { return json({ error: 'Formato inválido.' }, 400) }
  const id = trackerId(payload.trackerSiteId)
  const domain = siteDomain(payload.domain)
  const supabaseSiteId = compactText(payload.supabaseSiteId, 64)
  const businessId = compactText(payload.businessId, 64)
  if (!id || !domain) return json({ error: 'Identificação ou domínio inválido.' }, 400)
  await env.ANALIZI_EVENTS.batch([env.ANALIZI_EVENTS.prepare(`
    insert into tracker_sites (tracker_site_id, supabase_site_id, business_id, domain, is_active)
    values (?, ?, ?, ?, 1)
    on conflict(tracker_site_id) do update set domain = excluded.domain, is_active = 1, updated_at = current_timestamp
  `).bind(id, supabaseSiteId || id, businessId || id, domain)])
  return json({ trackerSiteId: id, domain })
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

async function analytics(id: string, env: Env, query: URLSearchParams) {
  const safeId = trackerId(id)
  if (!safeId) return json({ error: 'Identificação inválida.' }, 400)
  const requestedDays = Math.min(730, Math.max(1, Math.floor(Number(query.get('days') || 7))))
  const requestedEnd = query.get('end')
  const requestedStart = query.get('start')
  const end = validDate(requestedEnd) ? requestedEnd! : isoDate(new Date())
  let start = validDate(requestedStart) ? requestedStart! : shiftDate(end, -requestedDays + 1)
  if (start > end) start = end
  const rawDays = Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1
  const period = Math.min(730, Math.max(1, rawDays))
  if (rawDays > 730) start = shiftDate(end, -729)
  const rangeEnd = shiftDate(end, 1)
  const previousStart = shiftDate(start, -period)
  const group = query.get('group') || 'day'
  const groupExpressions: Record<string, string> = { day: "date(occurred_at)", week: "strftime('%Y-W%W', occurred_at)", month: "strftime('%Y-%m', occurred_at)", quarter: "strftime('%Y', occurred_at) || '-T' || cast(((cast(strftime('%m', occurred_at) as integer) - 1) / 3 + 1) as text)", semester: "strftime('%Y', occurred_at) || '-S' || case when cast(strftime('%m', occurred_at) as integer) <= 6 then '1' else '2' end", year: "strftime('%Y', occurred_at)" }
  const groupExpression = groupExpressions[group] || groupExpressions.day
  const results = await env.ANALIZI_EVENTS.batch([
    env.ANALIZI_EVENTS.prepare(`select count(distinct visitor_id) users, count(distinct session_id) sessions, sum(event_name='page_view') pageViews, count(distinct case when event_name in ('whatsapp_contact','sign_up') then session_id end) contactSessions, sum(event_name in ('whatsapp_contact','sign_up')) contacts, sum(event_name='whatsapp_contact') whatsappContacts, sum(event_name='sign_up') signUps, sum(event_name='first_visit') newUsers, round(avg(engagement_time_ms)/1000) attentionSeconds from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select coalesce(source,'direto') name, count(*) value from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ? group by coalesce(source,'direto') order by value desc limit 6`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select coalesce(page_path,'/') path, max(page_title) title, sum(event_name='page_view') views, round(avg(engagement_time_ms)/1000) attentionSeconds, round(100.0 * sum(event_name='page_view' and page_path in (select page_path from events x where x.tracker_site_id=events.tracker_site_id and x.session_id=events.session_id order by occurred_at desc limit 1)) / nullif(sum(event_name='page_view'),0),1) exitRate from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ? group by coalesce(page_path,'/') order by views desc limit 250`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select ${groupExpression} date, count(distinct session_id) sessions, count(distinct visitor_id) users, sum(event_name='page_view') pageViews, count(distinct case when event_name in ('whatsapp_contact','sign_up') then session_id end) contacts from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ? group by ${groupExpression} order by date`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select coalesce(source,'direto') source, coalesce(page_path,'/') path, sum(event_name='page_view') views, count(distinct visitor_id) users from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ? group by source,path order by views desc limit 250`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select date(occurred_at) date, event_name type, coalesce(page_path,'/') path, count(*) contacts from events where tracker_site_id=? and event_name in ('whatsapp_contact','sign_up') and occurred_at >= ? and occurred_at < ? group by date(occurred_at), event_name, coalesce(page_path,'/') order by date, contacts desc limit 250`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select date(occurred_at) date, coalesce(page_path,'/') path, coalesce(json_extract(metadata_json,'$.button_label'),'Botão sem texto') label, coalesce(json_extract(metadata_json,'$.button_id'),'') buttonId, coalesce(json_extract(metadata_json,'$.destination'),'') destination, count(*) clicks, count(distinct session_id) sessions from events where tracker_site_id=? and event_name='button_click' and occurred_at >= ? and occurred_at < ? group by date(occurred_at), path, label, buttonId, destination order by clicks desc, date desc limit 250`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select count(distinct visitor_id) users, count(distinct session_id) sessions, count(distinct case when event_name in ('whatsapp_contact','sign_up') then session_id end) contactSessions, sum(event_name='page_view') pageViews, sum(event_name in ('whatsapp_contact','sign_up')) contacts, sum(event_name='whatsapp_contact') whatsappContacts, sum(event_name='sign_up') signUps, sum(event_name='first_visit') newUsers, round(avg(engagement_time_ms)/1000) attentionSeconds from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?`).bind(safeId, previousStart, start),
    env.ANALIZI_EVENTS.prepare(`select coalesce(page_path,'/') path, sum(case when occurred_at >= ? and occurred_at < ? and event_name='page_view' then 1 else 0 end) currentViews, sum(case when occurred_at >= ? and occurred_at < ? and event_name='page_view' then 1 else 0 end) previousViews from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ? group by path having currentViews > 0 or previousViews > 0 order by currentViews desc limit 30`).bind(start, rangeEnd, previousStart, start, safeId, previousStart, rangeEnd),
  ]) as Array<{ results?: Array<Record<string, unknown>> }>
  return json({ totals: results[0]?.results?.[0] ?? {}, sources: results[1]?.results ?? [], pages: results[2]?.results ?? [], daily: results[3]?.results ?? [], sourcePages: results[4]?.results ?? [], contactDetails: results[5]?.results ?? [], clickDetails: results[6]?.results ?? [], previousTotals: results[7]?.results?.[0] ?? {}, pageComparison: results[8]?.results ?? [], periodDays: period, start, end, group })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/v1/events') return collect(request, env)
    if (url.pathname === '/v1/tracker-sites') return provisionTrackerSite(request, env)
    const statusMatch = url.pathname.match(/^\/v1\/tracker-sites\/(ANLZ[A-Z0-9]{5}-A)\/status$/i)
    if (statusMatch) return trackerStatus(statusMatch[1], env)
    const analyticsMatch = url.pathname.match(/^\/v1\/analytics\/(ANLZ[A-Z0-9]{5}-A)$/i)
    if (analyticsMatch) return analytics(analyticsMatch[1], env, url.searchParams)
    return env.ASSETS.fetch(request)
  },
}
