// Cálculos dos relatórios semanais, compartilhados entre a tela (WeeklyReport)
// e a geração de insights no worker. Assim o que a IA comenta é exatamente o que a tela mostra.

export type ReportKind = 'geral' | 'contatos' | 'visitas' | 'regiao'
export const REPORT_KINDS: ReportKind[] = ['geral', 'contatos', 'visitas', 'regiao']

export type ReportTotals = { pageViews?: number, views?: number, users: number, newUsers?: number, contactClicks: number, whatsappClicks: number }
export type ReportData = {
  totals: ReportTotals,
  previousTotals?: ReportTotals,
  sources: Array<{ name: string, value: string | number }>,
  pages: Array<{ path: string, views: string | number, title?: string, exitRate?: number }>,
  daily: Array<{ date: string, pageViews: number, users: number, contacts: number }>,
  locations?: Array<{ country: string, region: string, city: string, users: number, conversions: number }>,
  devices?: Array<{ device: string, users: number, sessions: number }>,
  sourceMediumResults?: Array<{ source: string, contactClicks: number }>,
  pageConversionResults?: Array<{ path: string, sessions: number, whatsappClicks: number, contactSessions: number }>,
  contactDetails?: Array<{ type: string, contacts: number }>,
  peakHours?: Array<{ dayOfWeek: number, hourOfDay: number, views: number, contacts: number }>,
}

export const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
export const n = (v: unknown) => Number(v || 0)
export const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR')
export const views = (t?: ReportTotals) => n(t?.pageViews ?? t?.views)
export const weekdayOf = (d: string) => WEEKDAYS[new Date(`${d}T12:00:00Z`).getUTCDay()]

/** "3 em cada 10" — cai para porcentagem quando arredonda para zero. */
export function inTen(part: number, total: number) {
  if (!total) return '0'
  const k = Math.round((part / total) * 10)
  return k >= 1 ? `${k} em cada 10` : `${Math.round((part / total) * 100)}%`
}
/** exitRate pode vir como fração (0,6) ou porcentagem (60). */
export const exitPct = (v: unknown) => { const x = n(v); return x > 1 ? x : x * 100 }

export const CONTACT_LABEL: Record<string, [string, string]> = {
  whatsapp: ['pelo WhatsApp', 'Clicaram no botão do WhatsApp.'],
  form_submit: ['pelo formulário', 'Enviaram o formulário do site.'],
  phone: ['por telefone', 'Clicaram no número para ligar.'],
  tel: ['por telefone', 'Clicaram no número para ligar.'],
  phone_click: ['por telefone', 'Clicaram no número para ligar.'],
  email: ['por e-mail', 'Clicaram no endereço de e-mail.'],
  email_click: ['por e-mail', 'Clicaram no endereço de e-mail.'],
}

/** Contatos dos totais da semana anterior (que só trazem os totais). */
export const totalContacts = (t?: ReportTotals) => Math.max(n(t?.contactClicks), n(t?.whatsappClicks))

/** Normaliza o tipo de contato vindo do GA4/tracker (ex.: whatsapp_contact → whatsapp). */
export function contactKey(type?: string) {
  const k = (type || 'outro').toLowerCase().trim()
  if (k.includes('whatsapp')) return 'whatsapp'
  if (k.includes('form')) return 'form_submit'
  if (k.includes('phone') || k.includes('tel') || k.includes('call')) return 'phone'
  if (k.includes('mail')) return 'email'
  return k
}

export function derive(d: ReportData, normalizeSource: (s: string) => string) {
  const pageTitle = (path: string) => d.pages.find(pg => pg.path === path)?.title || (path === '/' ? 'Página inicial' : path)
  const t = d.totals, p = d.previousTotals
  const users = n(t.users), pv = views(t)
  const sources = new Map<string, number>()
  d.sources.forEach(s => { const k = normalizeSource(s.name); sources.set(k, (sources.get(k) || 0) + n(s.value)) })
  const sourceList = [...sources.entries()].sort((a, b) => b[1] - a[1])
  const sourceTotal = sourceList.reduce((a, s) => a + s[1], 0)
  const srcContacts = new Map<string, number>()
  ;(d.sourceMediumResults ?? []).forEach(r => { const k = normalizeSource(r.source); srcContacts.set(k, (srcContacts.get(k) || 0) + n(r.contactClicks)) })
  const contactSourceList = [...srcContacts.entries()].sort((a, b) => b[1] - a[1])
  const topContactSource = contactSourceList[0]
  const pageContacts = [...(d.pageConversionResults ?? [])].map(r => ({ path: r.path, c: n(r.contactSessions || r.whatsappClicks), s: n(r.sessions) })).sort((a, b) => b.c - a.c)
  const topPages = [...d.pages].sort((a, b) => n(b.views) - n(a.views))
  const leak = d.pages.filter(pg => n(pg.views) >= 20 && n(pg.exitRate) > 0).sort((a, b) => exitPct(b.exitRate) * n(b.views) - exitPct(a.exitRate) * n(a.views))[0]
  const devices = new Map<string, number>()
  ;(d.devices ?? []).forEach(r => { const k = (r.device || '').toLowerCase(); devices.set(k, (devices.get(k) || 0) + n(r.users || r.sessions)) })
  const devTotal = [...devices.values()].reduce((a, b) => a + b, 0)
  const mobile = devices.get('mobile') || devices.get('celular') || 0
  const peak = [...(d.peakHours ?? [])].sort((a, b) => n(b.contacts) - n(a.contacts) || n(b.views) - n(a.views))[0]
  const daily = d.daily
  const bestViews = daily.reduce<ReportData['daily'][number] | null>((b, x) => !b || n(x.pageViews) > n(b.pageViews) ? x : b, null)
  const bestContacts = daily.reduce<ReportData['daily'][number] | null>((b, x) => !b || n(x.contacts) > n(b.contacts) ? x : b, null)
  const cities = new Map<string, { users: number, conv: number, region: string }>()
  ;(d.locations ?? []).forEach(l => { if (!l.city || l.city === '(not set)') return; const c = cities.get(l.city) || { users: 0, conv: 0, region: l.region }; c.users += n(l.users); c.conv += n(l.conversions); cities.set(l.city, c) })
  const cityList = [...cities.entries()].sort((a, b) => b[1].users - a[1].users)
  const regions = new Map<string, number>()
  ;(d.locations ?? []).forEach(l => { const k = l.region || ''; if (k) regions.set(k, (regions.get(k) || 0) + n(l.users)) })
  const regionList = [...regions.entries()].sort((a, b) => b[1] - a[1])
  const locTotal = regionList.reduce((a, r) => a + r[1], 0)
  const contactTypes = new Map<string, number>()
  ;(d.contactDetails ?? []).forEach(c => { const k = contactKey(c.type); contactTypes.set(k, (contactTypes.get(k) || 0) + n(c.contacts)) })
  // O total do GA4 (contact_clicks) às vezes não inclui eventos como whatsapp_contact; usa o maior valor disponível.
  const contacts = Math.max(n(t.contactClicks), n(t.whatsappClicks), [...contactTypes.values()].reduce((a, b) => a + b, 0))
  const bestConvCity = cityList.filter(([, c]) => c.users >= 10).sort((a, b) => b[1].conv / b[1].users - a[1].conv / a[1].users)[0]
  return { t, p, contacts, users, pv, sourceList, sourceTotal, contactSourceList, topContactSource, pageContacts, topPages, leak, devTotal, mobile, peak, daily, bestViews, bestContacts, cityList, regionList, locTotal, contactTypes, bestConvCity, pageTitle, peakHours: d.peakHours ?? [] }
}
export type Derived = ReturnType<typeof derive>
