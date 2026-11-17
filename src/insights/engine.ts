// Motor de insights comparativos do Analizi.
//
// O código calcula as comparações (canal × canal, celular × computador,
// página × média, semana × semana) e monta cards curtos e prontos.
// A IA só reescreve o texto desses cards, sem poder inventar números;
// se ela errar o formato, usamos o card do próprio motor.

import { chatJSON, hasLLM, type LLMEnv } from './llm'

interface D1Statement {
  bind(...values: unknown[]): D1Statement
}
interface D1Database {
  prepare(query: string): D1Statement
  batch(statements: D1Statement[]): Promise<unknown>
}

export interface AIInsight {
  key: string
  type: string
  title: string
  status: 'positive' | 'warning' | 'neutral'
  badge: string
  /** Linha de prova: os números comparados. */
  finding: string
  /** O que fazer? */
  action: string
  /** O que esperar? */
  projection: string
}

export interface BusinessContext {
  name?: string
  segment?: string
  subsegment?: string
  segmentDetail?: string
}

interface Candidate extends AIInsight {
  score: number
  facts: Record<string, string | number>
}

type Row = Record<string, unknown>

const MIN_SESSIONS = 20 // volume mínimo para comparar dois segmentos
const LIMITS = { title: 7, finding: 12, action: 18, projection: 14 }

// ---------- formatação ----------

const n = (v: unknown) => Number(v || 0)
const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0)
const fmtPct = (v: number) => `${v >= 10 ? Math.round(v) : v.toFixed(1).replace('.', ',')}%`
const fmtRatio = (v: number) => (v >= 10 ? `${Math.round(v)}X` : `${(Math.round(v * 10) / 10).toString().replace('.', ',')}X`)
const pageName = (path: string) => (!path || path === '/' ? 'PÁGINA INICIAL' : path)
const channelName = (src: string) => {
  const s = (src || '').trim()
  if (!s || s.toLowerCase() === 'direto' || s.toLowerCase() === '(direct)') return 'Acesso direto'
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const deviceName = (d: string) => ({ mobile: 'celular', desktop: 'computador', tablet: 'tablet' } as Record<string, string>)[d] || d
const plural = (v: number, one: string, many: string) => `${v} ${v === 1 ? one : many}`
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

// ---------- coleta ----------

export function lastClosedWeek(today: string, shift: (d: string, days: number) => string) {
  // Última semana fechada: segunda a domingo anterior a hoje (UTC), em qualquer dia da semana.
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay() || 7
  const end = shift(today, -dow)
  const start = shift(end, -6)
  return { start, end, prevStart: shift(start, -7), prevEnd: shift(start, -1) }
}

async function collect(db: D1Database, siteId: string, w: { start: string; end: string; prevStart: string; prevEnd: string }) {
  const q = (sql: string, ...params: unknown[]) => db.prepare(sql).bind(...params)
  const R = 'whatsapp_clicks + sign_ups + form_submits'
  const res = (await db.batch([
    // 0/1: canais (atual / anterior)
    q(`select source, sum(sessions) sessions, sum(conversions) conv, sum(${R}) contacts from daily_source_medium_results where tracker_site_id=? and metric_date between ? and ? group by source`, siteId, w.start, w.end),
    q(`select source, sum(sessions) sessions, sum(conversions) conv from daily_source_medium_results where tracker_site_id=? and metric_date between ? and ? group by source`, siteId, w.prevStart, w.prevEnd),
    // 2: dispositivos
    q(`select device_type device, sum(sessions) sessions, sum(conversions) conv from daily_source_medium_results where tracker_site_id=? and metric_date between ? and ? group by device_type`, siteId, w.start, w.end),
    // 3: páginas (visitas + contatos por página)
    q(`select page_path path, sum(page_views) views, sum(entrances) entrances, round(sum(exit_rate * page_views) / nullif(sum(page_views), 0), 1) exitRate, round(sum(average_engagement_seconds * page_views) / nullif(sum(page_views), 0)) attention from daily_pages where tracker_site_id=? and metric_date between ? and ? group by page_path`, siteId, w.start, w.end),
    q(`select page_path path, sum(contacts) contacts from daily_contacts where tracker_site_id=? and metric_date between ? and ? group by page_path`, siteId, w.start, w.end),
    // 5: melhor página por canal (onde cada canal converte)
    q(`select source, page_path path, sum(sessions) sessions, sum(conversions) conv from daily_source_medium_results where tracker_site_id=? and metric_date between ? and ? group by source, page_path`, siteId, w.start, w.end),
    // 6/7: totais
    q(`select sum(sessions) sessions, sum(conversions) conv from daily_metrics where tracker_site_id=? and metric_date between ? and ?`, siteId, w.start, w.end),
    q(`select sum(sessions) sessions, sum(conversions) conv from daily_metrics where tracker_site_id=? and metric_date between ? and ?`, siteId, w.prevStart, w.prevEnd),
    // 8: rolagem até 50% por página no celular
    q(`select page_path path, depth_bracket bracket, sum(visitors) visitors from daily_page_scroll where tracker_site_id=? and metric_date between ? and ? and device_type='mobile' group by page_path, depth_bracket`, siteId, w.start, w.end)
  ])) as Array<{ results?: Row[] }>
  const r = (i: number) => res[i]?.results ?? []
  return {
    sources: r(0), prevSources: r(1), devices: r(2), pages: r(3), pageContacts: r(4),
    sourcePages: r(5), totals: r(6)[0] || {}, prevTotals: r(7)[0] || {}, scroll: r(8)
  }
}

type Data = Awaited<ReturnType<typeof collect>>

// ---------- candidatos ----------

function bestPageFor(data: Data, source: string): string | null {
  const rows = data.sourcePages
    .filter((r) => r.source === source && n(r.sessions) >= 5)
    .sort((a, b) => pct(n(b.conv), n(b.sessions)) - pct(n(a.conv), n(a.sessions)) || n(b.sessions) - n(a.sessions))
  return rows[0] && n(rows[0].conv) > 0 ? String(rows[0].path) : null
}

function channelEfficiency(data: Data): Candidate | null {
  const ch = data.sources.filter((r) => n(r.sessions) >= MIN_SESSIONS)
  if (ch.length < 2) return null
  const byVolume = [...ch].sort((a, b) => n(b.sessions) - n(a.sessions))[0]
  const byRate = [...ch].sort((a, b) => pct(n(b.conv), n(b.sessions)) - pct(n(a.conv), n(a.sessions)))[0]
  if (byVolume.source === byRate.source) return null
  const rBest = pct(n(byRate.conv), n(byRate.sessions))
  const rVol = pct(n(byVolume.conv), n(byVolume.sessions))
  if (rBest <= 0 || (rVol > 0 && rBest / rVol < 1.5)) return null

  const best = channelName(String(byRate.source))
  const vol = channelName(String(byVolume.source))
  const target = (rBest + rVol) / 2
  const gain = Math.max(1, Math.round((n(byVolume.sessions) * (target - rVol)) / 100))
  const page = bestPageFor(data, String(byRate.source))
  const title = rVol > 0 ? `${best} converteu ${fmtRatio(rBest / rVol)} mais que ${vol}` : `${best} gera contatos, ${vol} não`

  return {
    key: 'channel_efficiency', type: 'top_channel', status: 'warning', badge: 'Canais',
    title: title.toUpperCase(),
    finding: `${fmtPct(rBest)} vs. ${fmtPct(rVol)} das visitas viraram contato.`,
    action: page
      ? `Leve o link do ${vol} para ${pageName(page)}, a página que converte no ${best}.`
      : `Use no ${vol} a mesma oferta e página de destino do ${best}.`,
    projection: `+${plural(gain, 'contato', 'contatos')} por semana se ${vol} chegar a ${fmtPct(target)}.`,
    score: gain * 3,
    facts: { melhorCanal: best, taxaMelhor: fmtPct(rBest), canalVolume: vol, taxaVolume: fmtPct(rVol), visitasVolume: n(byVolume.sessions), paginaDestino: page ? pageName(page) : '-', ganho: gain, meta: fmtPct(target) }
  }
}

function deviceGap(data: Data, topPage: string): Candidate | null {
  const mob = data.devices.find((d) => d.device === 'mobile')
  const desk = data.devices.find((d) => d.device === 'desktop')
  if (!mob || !desk || n(mob.sessions) < MIN_SESSIONS || n(desk.sessions) < MIN_SESSIONS) return null
  const rm = pct(n(mob.conv), n(mob.sessions))
  const rd = pct(n(desk.conv), n(desk.sessions))
  const [hi, lo, rHi, rLo, loRow] = rd >= rm ? [desk, mob, rd, rm, mob] : [mob, desk, rm, rd, desk]
  if (rHi <= 0 || (rLo > 0 && rHi / rLo < 1.5)) return null
  const loName = deviceName(String(lo.device))
  const hiName = deviceName(String(hi.device))
  const gain = Math.max(1, Math.round((n(loRow.sessions) * (rHi - rLo)) / 2 / 100))
  const share = Math.round(pct(n(lo.sessions), n(mob.sessions) + n(desk.sessions)))
  const title = rLo > 0 ? `${loName} converte ${fmtRatio(rHi / rLo)} menos que ${hiName}` : `${loName} não gera contatos`
  return {
    key: 'device_gap', type: 'opportunity', status: 'warning', badge: 'Dispositivos',
    title: title.toUpperCase(),
    finding: `${fmtPct(rLo)} vs. ${fmtPct(rHi)}, com ${share}% das visitas no ${loName}.`,
    action: `Abra ${pageName(topPage)} no ${loName} e deixe o botão de contato visível sem rolar.`,
    projection: `+${plural(gain, 'contato', 'contatos')} por semana se o ${loName} reduzir metade da diferença.`,
    score: gain * 3,
    facts: { pior: loName, taxaPior: fmtPct(rLo), melhor: hiName, taxaMelhor: fmtPct(rHi), participacao: `${share}%`, pagina: pageName(topPage), ganho: gain }
  }
}

function pageVsAverage(data: Data): Candidate[] {
  const contactsBy = new Map(data.pageContacts.map((r) => [String(r.path), n(r.contacts)]))
  const pages = data.pages.filter((p) => n(p.views) >= MIN_SESSIONS)
  const totalViews = pages.reduce((s, p) => s + n(p.views), 0)
  const totalContacts = pages.reduce((s, p) => s + (contactsBy.get(String(p.path)) || 0), 0)
  if (!pages.length || totalViews === 0) return []
  const avgRate = pct(totalContacts, totalViews)
  const avgExit = pages.reduce((s, p) => s + n(p.exitRate) * n(p.views), 0) / totalViews
  const out: Candidate[] = []

  // Página escondida: converte bem acima da média, mas recebe pouco tráfego
  const gem = pages
    .map((p) => ({ p, rate: pct(contactsBy.get(String(p.path)) || 0, n(p.views)), share: pct(n(p.views), totalViews) }))
    .filter((x) => avgRate > 0 && x.rate >= avgRate * 2 && x.share < 25 && (contactsBy.get(String(x.p.path)) || 0) >= 2)
    .sort((a, b) => b.rate - a.rate)[0]
  if (gem) {
    const topChannel = [...data.sources].sort((a, b) => n(b.sessions) - n(a.sessions))[0]
    const ch = topChannel ? channelName(String(topChannel.source)) : 'seu canal principal'
    const extraViews = Math.round(totalViews * 0.1)
    const gain = Math.max(1, Math.round((extraViews * (gem.rate - avgRate)) / 100))
    out.push({
      key: 'hidden_page', type: 'opportunity', status: 'positive', badge: 'Páginas',
      title: `${pageName(String(gem.p.path))} converte ${fmtRatio(gem.rate / avgRate)} mais que a média`.toUpperCase(),
      finding: `${fmtPct(gem.rate)} vs. ${fmtPct(avgRate)}, mas recebe só ${Math.round(gem.share)}% das visitas.`,
      action: `Aponte o próximo post do ${ch} direto para ${pageName(String(gem.p.path))}.`,
      projection: `+${plural(gain, 'contato', 'contatos')} por semana levando 10% das visitas para ela.`,
      score: gain * 2.5,
      facts: { pagina: pageName(String(gem.p.path)), taxa: fmtPct(gem.rate), media: fmtPct(avgRate), participacao: `${Math.round(gem.share)}%`, canal: ch, ganho: gain }
    })
  }

  // Página que vaza: muita entrada, saída bem acima da média e sem contatos proporcionais
  const leak = pages
    .filter((p) => n(p.exitRate) >= avgExit + 15 && n(p.exitRate) >= 50 && pct(contactsBy.get(String(p.path)) || 0, n(p.views)) <= avgRate)
    .sort((a, b) => n(b.views) * n(b.exitRate) - n(a.views) * n(a.exitRate))[0]
  if (leak) {
    const path = String(leak.path)
    const sc = data.scroll.filter((s) => s.path === path)
    const reach25 = n(sc.find((s) => s.bracket === '25%')?.visitors)
    const reach50 = n(sc.find((s) => s.bracket === '50%')?.visitors)
    const halfRead = reach25 >= MIN_SESSIONS ? Math.round(pct(reach50, reach25)) : null
    const lost = Math.round((n(leak.views) * (n(leak.exitRate) - avgExit)) / 100)
    out.push({
      key: 'leaking_page', type: 'opportunity', status: 'warning', badge: 'Páginas',
      title: `${pageName(path)} perde ${fmtPct(n(leak.exitRate))} das visitas`.toUpperCase(),
      finding: halfRead !== null
        ? `Média do site: ${fmtPct(avgExit)}. No celular, ${halfRead}% chegam à metade.`
        : `Média do site: ${fmtPct(avgExit)} de saída.`,
      action: `Suba o botão de contato para o topo de ${pageName(path)} e corte o texto inicial.`,
      projection: `Saída abaixo de ${fmtPct(Math.max(avgExit, n(leak.exitRate) - 10))} na próxima semana.`,
      score: Math.max(1, lost * Math.max(avgRate, 1) / 100) * 2,
      facts: { pagina: pageName(path), saida: fmtPct(n(leak.exitRate)), mediaSaida: fmtPct(avgExit), metade: halfRead ?? '-', meta: fmtPct(Math.max(avgExit, n(leak.exitRate) - 10)) }
    })
  }
  return out
}

function trafficDriver(data: Data, topPage: string): Candidate | null {
  const cur = n(data.totals.sessions)
  const prev = n(data.prevTotals.sessions)
  if (prev < MIN_SESSIONS || cur + prev < MIN_SESSIONS * 2) return null
  const delta = cur - prev
  const change = pct(delta, prev)
  if (Math.abs(change) < 15) return null
  const prevBy = new Map(data.prevSources.map((r) => [String(r.source), n(r.sessions)]))
  const names = new Set([...data.sources.map((r) => String(r.source)), ...prevBy.keys()])
  const deltas = [...names].map((s) => ({ s, now: n(data.sources.find((r) => r.source === s)?.sessions), before: prevBy.get(s) || 0 }))
    .map((x) => ({ ...x, d: x.now - x.before }))
    .sort((a, b) => (delta < 0 ? a.d - b.d : b.d - a.d))
  const driver = deltas[0]
  if (!driver || Math.sign(driver.d) !== Math.sign(delta)) return null
  const explains = Math.min(100, Math.round(pct(driver.d, delta)))
  const ch = channelName(driver.s)
  const up = delta > 0
  const rate = pct(n(data.totals.conv), cur)
  const contactsDelta = Math.round((Math.abs(driver.d) * rate) / 100)
  return {
    key: up ? 'traffic_growth' : 'traffic_drop', type: up ? 'traffic_growth' : 'traffic_drop',
    status: up ? 'positive' : 'warning', badge: 'Tendência semanal',
    title: `Visitas ${up ? 'subiram' : 'caíram'} ${fmtPct(Math.abs(change))}: ${ch} explica ${explains}%`.toUpperCase(),
    finding: `${ch}: ${driver.before} → ${driver.now} visitas vs. semana anterior.`,
    action: up
      ? `Repita no ${ch} o post desta semana, com link para ${pageName(topPage)}.`
      : `Volte a publicar no ${ch} com link direto para ${pageName(topPage)}.`,
    projection: up
      ? `Manter o ${ch} acima de ${driver.now} visitas por semana.`
      : `Recuperar ${driver.before} visitas do ${ch}${contactsDelta ? ` = +${plural(contactsDelta, 'contato', 'contatos')}` : ''}.`,
    score: Math.max(1, contactsDelta) * (up ? 1.2 : 2.2),
    facts: { canal: ch, antes: driver.before, agora: driver.now, variacao: fmtPct(Math.abs(change)), explica: `${explains}%`, pagina: pageName(topPage), contatos: contactsDelta }
  }
}

function contactRateChange(data: Data, topPage: string): Candidate | null {
  const cur = n(data.totals.sessions), prev = n(data.prevTotals.sessions)
  if (cur < MIN_SESSIONS || prev < MIN_SESSIONS) return null
  const r = pct(n(data.totals.conv), cur), rp = pct(n(data.prevTotals.conv), prev)
  if (rp <= 0 && r <= 0) return null
  const ch = rp > 0 ? pct(r - rp, rp) : 100
  if (Math.abs(ch) < 30 || Math.abs(n(data.totals.conv) - n(data.prevTotals.conv)) < 2) return null
  const up = ch > 0
  const recover = Math.round((cur * Math.abs(rp - r)) / 100)
  return {
    key: 'lead_conversion', type: 'lead_conversion', status: up ? 'positive' : 'warning', badge: 'Contatos',
    title: `Taxa de contato ${up ? 'subiu' : 'caiu'} ${fmtPct(Math.abs(ch))}`.toUpperCase(),
    finding: `${fmtPct(r)} vs. ${fmtPct(rp)} das visitas na semana anterior.`,
    action: up
      ? `Anote o que mudou em ${pageName(topPage)} nesta semana e mantenha.`
      : `Teste os botões de contato de ${pageName(topPage)} no celular hoje.`,
    projection: up ? `Manter a taxa acima de ${fmtPct(rp)} na próxima semana.` : `Voltar a ${fmtPct(rp)} = +${plural(recover, 'contato', 'contatos')} por semana.`,
    score: Math.max(1, recover) * (up ? 1 : 2.5),
    facts: { taxa: fmtPct(r), anterior: fmtPct(rp), variacao: fmtPct(Math.abs(ch)), pagina: pageName(topPage), recuperar: recover }
  }
}

function channelDependency(data: Data, topPage: string): Candidate | null {
  const total = data.sources.reduce((s, r) => s + n(r.sessions), 0)
  if (total < MIN_SESSIONS * 2) return null
  const top = [...data.sources].sort((a, b) => n(b.sessions) - n(a.sessions))[0]
  const share = pct(n(top.sessions), total)
  if (share < 60) return null
  const ch = channelName(String(top.source))
  return {
    key: 'channel_dependency', type: 'top_channel', status: 'neutral', badge: 'Risco',
    title: `${Math.round(share)}% das visitas dependem do ${ch}`.toUpperCase(),
    finding: `${n(top.sessions)} de ${total} visitas vieram de um só canal.`,
    action: `Publique o mesmo conteúdo em um segundo canal, com link para ${pageName(topPage)}.`,
    projection: `Segundo canal chegando a 20% das visitas em 4 semanas.`,
    score: 1.5,
    facts: { canal: ch, participacao: `${Math.round(share)}%`, visitas: n(top.sessions), total, pagina: pageName(topPage) }
  }
}

function lowData(data: Data): Candidate {
  const s = n(data.totals.sessions)
  return {
    key: 'low_data', type: 'opportunity', status: 'neutral', badge: 'Dados insuficientes',
    title: 'AINDA FALTAM VISITAS PARA COMPARAR',
    finding: `${s} visitas na semana; comparações pedem ${MIN_SESSIONS} por grupo.`,
    action: 'Divulgue um único link identificado em um canal nesta semana.',
    projection: 'Na próxima segunda, a primeira comparação entre canais.',
    score: 0,
    facts: { visitas: s, minimo: MIN_SESSIONS }
  }
}

export function buildCandidates(data: Data): Candidate[] {
  const topPageRow = [...data.pages].sort((a, b) => n(b.views) - n(a.views))[0]
  const topPage = topPageRow ? String(topPageRow.path) : '/'
  const list = [
    channelEfficiency(data),
    deviceGap(data, topPage),
    ...pageVsAverage(data),
    trafficDriver(data, topPage),
    contactRateChange(data, topPage),
    channelDependency(data, topPage)
  ].filter((c): c is Candidate => !!c)
  // Duas sobre o mesmo tema (ex.: dois de canal) só entram se não houver outra
  const ranked = list.sort((a, b) => b.score - a.score)
  const picked: Candidate[] = []
  const seen = new Set<string>()
  for (const c of ranked) { if (!seen.has(c.type)) { picked.push(c); seen.add(c.type) } }
  for (const c of ranked) { if (picked.length < 4 && !picked.includes(c)) picked.push(c) }
  const top = picked.slice(0, 4)
  return top.length ? top : [lowData(data)]
}

// ---------- IA: só reescreve ----------

const numbersIn = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(',', '.'))

function validRewrite(c: Candidate, r: Partial<AIInsight>): boolean {
  const fields = ['title', 'finding', 'action', 'projection'] as const
  const allowed = new Set(numbersIn(`${c.title} ${c.finding} ${c.action} ${c.projection} ${Object.values(c.facts).join(' ')}`))
  return fields.every((f) => {
    const v = r[f]
    if (typeof v !== 'string' || !v.trim() || words(v) > LIMITS[f]) return false
    return numbersIn(v).every((x) => allowed.has(x))
  })
}

async function rewriteWithAI(llm: LLMEnv, business: BusinessContext, cands: Candidate[]): Promise<AIInsight[] | null> {
  const negocio = [business.name, business.segment, business.subsegment, business.segmentDetail].filter(Boolean).join(' · ') || 'pequeno negócio'
  const payload = cands.map((c) => ({ id: c.key, title: c.title, finding: c.finding, action: c.action, projection: c.projection, fatos: c.facts }))
  const prompt = `Você revisa cards de insight para o dono de um ${negocio}, que não entende de analytics.
Cada card já tem a comparação e os números corretos. Reescreva para ficar mais claro e específico para esse negócio, sem perder a comparação.

REGRAS:
- Use SOMENTE números que aparecem no card ou em "fatos". Não calcule nem invente números.
- title: em MAIÚSCULAS, até ${LIMITS.title} palavras, com a comparação (ex.: GOOGLE CONVERTEU 3X MAIS QUE INSTAGRAM).
- finding: os dois números comparados, até ${LIMITS.finding} palavras.
- action: uma única ação, dizendo onde fazer, até ${LIMITS.action} palavras.
- projection: métrica, direção e condição, até ${LIMITS.projection} palavras.
- Escreva "PÁGINA INICIAL" no lugar de "/". Sem jargão (nada de CTA, conversão, funil, tráfego orgânico).
- Mantenha os ids e a ordem.

CARDS:
${JSON.stringify(payload)}

Responda só JSON: {"insights":[{"id":"","title":"","finding":"","action":"","projection":""}]}`

  try {
    const raw = await chatJSON(llm, [
      { role: 'system', content: 'Responda APENAS JSON válido.' },
      { role: 'user', content: prompt }
    ], 0.2)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { insights?: Array<Partial<AIInsight> & { id?: string }> }
    const byId = new Map((parsed.insights || []).map((r) => [r.id, r]))
    return cands.map((c) => {
      const r = byId.get(c.key)
      return r && validRewrite(c, r)
        ? { ...strip(c), title: r.title!.toUpperCase(), finding: r.finding!, action: r.action!, projection: r.projection! }
        : strip(c)
    })
  } catch (err) {
    console.error('Falha ao reescrever insights com IA:', err)
    return null
  }
}

function strip(c: Candidate): AIInsight {
  const { score: _s, facts: _f, ...card } = c
  return card
}

// ---------- entrada ----------

export async function buildWeeklyInsights(
  db: D1Database,
  siteId: string,
  window: { start: string; end: string; prevStart: string; prevEnd: string },
  business: BusinessContext,
  llm: LLMEnv = {}
): Promise<{ insights: AIInsight[]; model: string }> {
  const data = await collect(db, siteId, window)
  const cands = buildCandidates(data)
  if (hasLLM(llm) && cands[0]?.key !== 'low_data') {
    const rewritten = await rewriteWithAI(llm, business, cands)
    if (rewritten) return { insights: rewritten, model: 'IZI INTELLIGENCE' }
  }
  return { insights: cands.map(strip), model: 'IZI INTELLIGENCE (regras)' }
}
