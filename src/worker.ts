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
  const isAuthSource = (s?: string | null) => {
    if (!s) return false
    return /accounts\.google\.com|appleid\.apple\.com|login\.microsoftonline\.com|auth0\.com|supabase\.co/i.test(s) ||
      /(?:auth|login|oauth|accounts)/i.test(s)
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
    if (isAuthSource(rawSource)) {
      rawSource = 'direto'
      rawMedium = rawMedium === 'referência' ? 'direto' : rawMedium
    }

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
      rawSource, rawMedium, compactText(event.campaign, 240),
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
  const page = compactText(query.get('page'), 1024)
  const source = compactText(query.get('source'), 120)
  const filterSql = `${page ? " and coalesce(page_path,'/')=?" : ''}${source ? " and coalesce(source,'direto')=?" : ''}`
  const filterValues = [page, source].filter(Boolean)
  const currentValues = [safeId, start, rangeEnd, ...filterValues]
  const previousValues = [safeId, previousStart, start, ...filterValues]
  const results = await env.ANALIZI_EVENTS.batch([
    env.ANALIZI_EVENTS.prepare(`select count(distinct visitor_id) users, count(distinct session_id) sessions, sum(event_name='page_view') pageViews, count(distinct case when event_name in ('whatsapp_contact','sign_up') then session_id end) contactSessions, sum(event_name in ('whatsapp_contact','sign_up')) contacts, sum(event_name='whatsapp_contact') whatsappContacts, sum(event_name='sign_up') signUps, sum(event_name='first_visit') newUsers, round(avg(engagement_time_ms)/1000) attentionSeconds from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?${filterSql}`).bind(...currentValues),
    env.ANALIZI_EVENTS.prepare(`select coalesce(source,'direto') name, count(*) value from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?${filterSql} group by coalesce(source,'direto') order by value desc limit 6`).bind(...currentValues),
    env.ANALIZI_EVENTS.prepare(`select coalesce(page_path,'/') path, max(page_title) title, sum(event_name='page_view') views, round(avg(engagement_time_ms)/1000) attentionSeconds, round(100.0 * sum(event_name='page_view' and events.id = (select x.id from events x where x.tracker_site_id=events.tracker_site_id and x.session_id=events.session_id and x.event_name='page_view' order by occurred_at desc, id desc limit 1) and not exists (select 1 from events i where i.tracker_site_id=events.tracker_site_id and i.session_id=events.session_id and (i.event_name in ('button_click','whatsapp_contact','sign_up','login') or i.is_conversion=1))) / nullif(sum(event_name='page_view'),0),1) exitRate from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?${filterSql} group by coalesce(page_path,'/') order by views desc limit 250`).bind(...currentValues),
    env.ANALIZI_EVENTS.prepare(`select ${groupExpression} date, count(distinct session_id) sessions, count(distinct visitor_id) users, sum(event_name='page_view') pageViews, count(distinct case when event_name in ('whatsapp_contact','sign_up') then session_id end) contacts from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?${filterSql} group by ${groupExpression} order by date`).bind(...currentValues),
    env.ANALIZI_EVENTS.prepare(`select coalesce(source,'direto') source, coalesce(page_path,'/') path, sum(event_name='page_view') views, count(distinct visitor_id) users from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?${filterSql} group by source,path order by views desc limit 250`).bind(...currentValues),
    env.ANALIZI_EVENTS.prepare(`select date(occurred_at) date, event_name type, coalesce(page_path,'/') path, count(*) contacts from events where tracker_site_id=? and event_name in ('whatsapp_contact','sign_up') and occurred_at >= ? and occurred_at < ?${filterSql} group by date(occurred_at), event_name, coalesce(page_path,'/') order by date, contacts desc limit 250`).bind(...currentValues),
    env.ANALIZI_EVENTS.prepare(`select date(occurred_at) date, coalesce(page_path,'/') path, coalesce(json_extract(metadata_json,'$.button_label'),'Botão sem texto') label, coalesce(json_extract(metadata_json,'$.button_id'),'') buttonId, coalesce(json_extract(metadata_json,'$.destination'),'') destination, coalesce(json_extract(metadata_json,'$.contact_intent'),'geral') intent, coalesce(json_extract(metadata_json,'$.is_contact_lead'), 0) isContactLead, count(*) clicks, count(distinct session_id) sessions from events where tracker_site_id=? and event_name='button_click' and occurred_at >= ? and occurred_at < ?${filterSql} group by date(occurred_at), path, label, buttonId, destination, intent, isContactLead order by clicks desc, date desc limit 250`).bind(...currentValues),
    env.ANALIZI_EVENTS.prepare(`select count(distinct visitor_id) users, count(distinct session_id) sessions, count(distinct case when event_name in ('whatsapp_contact','sign_up') then session_id end) contactSessions, sum(event_name='page_view') pageViews, sum(event_name in ('whatsapp_contact','sign_up')) contacts, sum(event_name='whatsapp_contact') whatsappContacts, sum(event_name='sign_up') signUps, sum(event_name='first_visit') newUsers, round(avg(engagement_time_ms)/1000) attentionSeconds from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?${filterSql}`).bind(...previousValues),
    env.ANALIZI_EVENTS.prepare(`select coalesce(page_path,'/') path, sum(case when occurred_at >= ? and occurred_at < ? and event_name='page_view' then 1 else 0 end) currentViews, sum(case when occurred_at >= ? and occurred_at < ? and event_name='page_view' then 1 else 0 end) previousViews from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ?${filterSql} group by path having currentViews > 0 or previousViews > 0 order by currentViews desc limit 30`).bind(start, rangeEnd, previousStart, start, safeId, previousStart, rangeEnd, ...filterValues),
    env.ANALIZI_EVENTS.prepare(`select distinct coalesce(page_path,'/') path from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ? order by path limit 250`).bind(safeId, start, rangeEnd),
    env.ANALIZI_EVENTS.prepare(`select distinct coalesce(source,'direto') source from events where tracker_site_id=? and occurred_at >= ? and occurred_at < ? order by source limit 100`).bind(safeId, start, rangeEnd),
  ]) as Array<{ results?: Array<Record<string, unknown>> }>
  return json({ totals: results[0]?.results?.[0] ?? {}, sources: results[1]?.results ?? [], pages: results[2]?.results ?? [], daily: results[3]?.results ?? [], sourcePages: results[4]?.results ?? [], contactDetails: results[5]?.results ?? [], clickDetails: results[6]?.results ?? [], previousTotals: results[7]?.results?.[0] ?? {}, pageComparison: results[8]?.results ?? [], filterPages: results[9]?.results ?? [], filterSources: results[10]?.results ?? [], periodDays: period, start, end, group })
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

  const { business, metrics } = body
  const apiKey = env.DEEPINFRA_API_KEY

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

  const buildRuleBasedFallback = (): AIInsight[] => {
    const list: AIInsight[] = []
    const growth = prevViews > 0 ? Math.round(((views - prevViews) / prevViews) * 100) : null

    if (growth !== null && growth >= 0) {
      list.push({
        key: 'traffic_growth',
        type: 'traffic_growth',
        title: 'Seu público está aumentando',
        status: 'positive',
        badge: 'Crescimento de Acessos',
        finding: `Você teve ${views} visualizações nos últimos ${period} dias, um avanço de ${growth}% em comparação com o período anterior.`,
        action: 'Mantenha a frequência nas divulgações que geraram esses acessos e garanta que o link de contato no site esteja bem visível.',
        projection: `Se mantiver esse ritmo, o site deve alcançar mais de ${Math.round(views * 1.2)} visitas no próximo ciclo.`
      })
    } else if (growth !== null && growth < 0) {
      list.push({
        key: 'traffic_drop',
        type: 'traffic_drop',
        title: 'Atenção ao recuo de visitas',
        status: 'warning',
        badge: 'Alerta de Tráfego',
        finding: `O número de visualizações caiu ${Math.abs(growth)}% em relação ao período anterior (total de ${views} acessos).`,
        action: 'Avalie compartilhar novidades ou links úteis nas suas redes ou canais de WhatsApp para reativar o interesse de clientes.',
        projection: 'Sem novas ações de atração, o volume de contatos pode reduzir nas próximas semanas.'
      })
    } else {
      list.push({
        key: 'traffic_growth',
        type: 'traffic_growth',
        title: 'Primeiros dados consolidados',
        status: 'positive',
        badge: 'Movimento Inicial',
        finding: `Foram registradas ${views} visualizações e ${users} pessoas únicas no período.`,
        action: 'Continue compartilhando o site com clientes e parceiros para consolidar a base de acessos.',
        projection: 'Com mais alguns dias de coleta, poderemos apontar o canal que traz mais retorno para você.'
      })
    }

    if (contacts > 0 || whatsapp > 0) {
      list.push({
        key: 'lead_conversion',
        type: 'lead_conversion',
        title: 'O site está gerando contatos reais',
        status: 'positive',
        badge: 'Oportunidades de Negócio',
        finding: `Foram iniciadas ${contacts} ações de contato no período (sendo ${whatsapp} diretamente pelo WhatsApp).`,
        action: 'Responda prontamente às mensagens recebidas. Se puder, pergunte ao cliente onde ele conheceu sua empresa para validar os canais.',
        projection: 'Manter a agilidade na resposta aumenta em até 50% as chances de fechar negócio a partir do site.'
      })
    } else if (views > 20) {
      list.push({
        key: 'lead_conversion',
        type: 'lead_conversion',
        title: 'Visitantes chegam, mas não chamam',
        status: 'warning',
        badge: 'Oportunidade de Contato',
        finding: `O site recebeu ${views} visualizações, mas ainda não registrou cliques em botões de contato ou WhatsApp.`,
        action: 'Adicione um botão de WhatsApp visível no rodapé ou cabeçalho convidando o visitante para tirar dúvidas.',
        projection: `Negócios de ${bSub || bSeg} com botão visível costumam transformar cerca de 3% a 6% das visitas em mensagens diretas.`
      })
    }

    if (topSource && topSourceVal > 0) {
      const share = views > 0 ? Math.round((topSourceVal / views) * 100) : 0
      list.push({
        key: 'top_channel',
        type: 'top_channel',
        title: `Principal canal: "${topSource}"`,
        status: 'neutral',
        badge: 'Origem de Destaque',
        finding: `O canal "${topSource}" foi responsável por ${share}% de todo o tráfego recebido no período.`,
        action: 'Fortaleça a presença nesse canal e crie links específicos para saber quais postagens dão mais resultado.',
        projection: 'Diversificar um segundo canal (como Google Meu Negócio ou Instagram) evita depender de apenas uma fonte.'
      })
    }

    list.push({
      key: 'opportunity',
      type: 'opportunity',
      title: `Oportunidade para ${bSub || bSeg}`,
      status: 'neutral',
      badge: 'Recomendação Prática',
      finding: `A página mais visitada foi "${topPage}" com ${topPageViews} visualizações. O tempo médio de retenção foi de ${attention} segundos.`,
      action: `Revise a página "${topPage}" para que a proposta de valor e a forma de entrar em contato apareçam antes de o usuário precisar rolar muito a tela.`,
      projection: 'Melhorias de clareza na primeira dobra costumam dobrar o tempo de permanência de novos visitantes.'
    })

    return list
  }

  if (!apiKey) {
    return json({
      insights: buildRuleBasedFallback(),
      model: 'rule-based',
      generatedAt: new Date().toISOString()
    })
  }

  const prompt = `Você é um analista de negócios e web analytics sênior do Analizi. Seu cliente é um pequeno ou médio empreendedor (leigo em tecnologia e termos como UTM, bounce rate, tracking).

DADOS DO CLIENTE E NEGÓCIO:
- Nome da Empresa: ${bName}
- Categoria Principal: ${bSeg}
- Tipo / Subsegmento: ${bSub}${bDet}
- Período avaliado: últimos ${period} dias
- Visualizações atuais: ${views} (período anterior: ${prevViews})
- Usuários únicos: ${users}
- Contatos/Leads totais: ${contacts}
- Contatos via WhatsApp: ${whatsapp}
- Tempo de atenção médio: ${attention} segundos
- Principal canal de tráfego: "${topSource}" (${topSourceVal} acessos)
- Página mais acessada: "${topPage}" (${topPageViews} visualizações)

TAREFA:
Gere exatamente 4 insights pré-definidos padronizados em JSON, sem jargões técnicos:
1. "traffic_growth" ou "traffic_drop": análise de visitas com comparação de período.
2. "lead_conversion": foco em conversões, contatos ou WhatsApp.
3. "top_channel": canal principal e recomendação de atração.
4. "opportunity": recomendação orientada ao tipo de negócio "${bSub || bSeg}" e à página mais visitada.

Formato esperado estritamente em JSON:
{
  "insights": [
    {
      "key": "traffic_growth",
      "type": "traffic_growth",
      "title": "Título simples de até 6 palavras",
      "status": "positive",
      "badge": "Crescimento de Acessos",
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
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de inteligência de negócios. Responda APENAS um JSON válido seguindo a estrutura solicitada sem blocos de texto fora do JSON.'
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
      console.error('DeepInfra status error:', aiResponse.status)
      return json({
        insights: buildRuleBasedFallback(),
        model: 'fallback-rules',
        generatedAt: new Date().toISOString()
      })
    }

    const aiData = await aiResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const rawContent = aiData.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(rawContent) as { insights?: AIInsight[] }

    if (Array.isArray(parsed.insights) && parsed.insights.length > 0) {
      return json({
        insights: parsed.insights,
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        generatedAt: new Date().toISOString()
      })
    }

    return json({
      insights: buildRuleBasedFallback(),
      model: 'fallback-rules',
      generatedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('Falha ao processar requisição DeepInfra:', err)
    return json({
      insights: buildRuleBasedFallback(),
      model: 'fallback-rules',
      generatedAt: new Date().toISOString()
    })
  }
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
    if (url.pathname === '/v1/ai-insights') return generateAIInsights(request, env)
    return env.ASSETS.fetch(request)
  },
}
