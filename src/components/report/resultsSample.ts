// Dados de exemplo para revisar a página Resultados por tipo de site.
// Usado só em desenvolvimento, com ?prototipo=<tipo> na URL.
import type { SiteType } from '../../lib/siteTypes'

type Row = { date: string, type: string, name: string, stage: 'confirmada' | 'intencao', path: string, conversions: number, sessions: number }

const DAYS = 14
const dates = () => Array.from({ length: DAYS }, (_, i) => { const d = new Date(Date.UTC(2026, 10, 4 + i)); return d.toISOString().slice(0, 10) })
// Variação diária determinística (sem Math.random, para o protótipo não mudar a cada recarga).
const wave = (i: number, seed: number) => 0.65 + 0.35 * Math.abs(Math.sin(i * 1.7 + seed)) + (new Date(Date.UTC(2026, 10, 4 + i)).getUTCDay() % 6 === 0 ? -0.25 : 0)

type Spec = { type: string, stage: 'confirmada' | 'intencao', name: string, path: string, perDay: number }

const SPECS: Record<SiteType, { sessionsPerDay: number, rows: Spec[], whatsapp: number, signUps: number, logins: number }> = {
  servicos: { sessionsPerDay: 120, whatsapp: 3, signUps: 0.4, logins: 0, rows: [
    { type: 'contato', stage: 'confirmada', name: 'Formulário de contato', path: '/contato', perDay: 1 },
    { type: 'orcamento', stage: 'confirmada', name: 'Peça um orçamento', path: '/orcamento', perDay: 0.6 },
    { type: 'telefone', stage: 'confirmada', name: 'Ligar agora', path: '/', perDay: 0.8 },
  ] },
  ecommerce: { sessionsPerDay: 190, whatsapp: 2, signUps: 0, logins: 0, rows: [
    { type: 'carrinho', stage: 'intencao', name: 'Adicionar ao carrinho', path: '/produto/tenis-runner', perDay: 13 },
    { type: 'carrinho', stage: 'intencao', name: 'Adicionar ao carrinho', path: '/produto/camiseta-basica', perDay: 8 },
    { type: 'carrinho_visita', stage: 'intencao', name: '', path: '/carrinho', perDay: 16 },
    { type: 'checkout', stage: 'intencao', name: 'Finalizar compra', path: '/checkout', perDay: 7 },
    { type: 'pagamento', stage: 'intencao', name: 'Gerar Pix', path: '/checkout', perDay: 4 },
    { type: 'compra', stage: 'confirmada', name: '', path: '/pedido-confirmado', perDay: 3 },
  ] },
  saas: { sessionsPerDay: 150, whatsapp: 0.8, signUps: 0, logins: 44, rows: [
    { type: 'cadastro', stage: 'confirmada', name: 'Começar teste grátis', path: '/', perDay: 4 },
    { type: 'cadastro', stage: 'confirmada', name: 'Criar conta', path: '/precos', perDay: 2 },
    { type: 'assinatura', stage: 'intencao', name: 'Assinar plano Pro', path: '/precos', perDay: 3.5 },
    { type: 'assinatura', stage: 'confirmada', name: '', path: '/assinatura-confirmada', perDay: 1 },
  ] },
  conteudo: { sessionsPerDay: 230, whatsapp: 1, signUps: 0, logins: 0, rows: [
    { type: 'download', stage: 'intencao', name: 'Baixar e-book grátis', path: '/blog/guia-completo', perDay: 11 },
    { type: 'download', stage: 'intencao', name: 'Catálogo em PDF', path: '/materiais', perDay: 5 },
    { type: 'newsletter', stage: 'confirmada', name: 'Receba novidades', path: '/blog', perDay: 3 },
    { type: 'checkout', stage: 'intencao', name: 'Quero o curso', path: '/curso', perDay: 2.4 },
    { type: 'compra', stage: 'confirmada', name: '', path: '/obrigado', perDay: 0.7 },
  ] },
  agendamento: { sessionsPerDay: 95, whatsapp: 2.2, signUps: 0, logins: 0, rows: [
    { type: 'agendamento', stage: 'intencao', name: 'Agendar consulta', path: '/', perDay: 1.8 },
    { type: 'agendamento', stage: 'intencao', name: 'Ver horários', path: '/especialidades', perDay: 0.9 },
    { type: 'agendamento', stage: 'confirmada', name: 'Formulário de agendamento', path: '/agendar', perDay: 0.6 },
    { type: 'telefone', stage: 'confirmada', name: 'Ligar', path: '/contato', perDay: 0.9 },
  ] },
  reservas: { sessionsPerDay: 140, whatsapp: 2.6, signUps: 0, logins: 0, rows: [
    { type: 'reserva', stage: 'intencao', name: 'Reservar agora', path: '/', perDay: 4.2 },
    { type: 'reserva', stage: 'intencao', name: 'Ver disponibilidade', path: '/quartos/suite-master', perDay: 1.6 },
    { type: 'reserva', stage: 'confirmada', name: '', path: '/reserva-confirmada', perDay: 1.3 },
    { type: 'telefone', stage: 'confirmada', name: 'Ligar para a recepção', path: '/contato', perDay: 1 },
  ] },
}

const TITLES: Record<string, string> = {
  '/': 'Página inicial', '/contato': 'Contato', '/orcamento': 'Orçamento', '/produto/tenis-runner': 'Tênis Runner', '/produto/camiseta-basica': 'Camiseta Básica',
  '/carrinho': 'Carrinho', '/checkout': 'Checkout', '/pedido-confirmado': 'Pedido confirmado', '/precos': 'Planos e preços', '/assinatura-confirmada': 'Assinatura confirmada',
  '/blog/guia-completo': 'Guia completo', '/materiais': 'Materiais gratuitos', '/blog': 'Blog', '/curso': 'Curso completo', '/obrigado': 'Obrigado',
  '/especialidades': 'Especialidades', '/agendar': 'Agendar', '/quartos/suite-master': 'Suíte Master', '/reserva-confirmada': 'Reserva confirmada',
}

export function sampleAnalytics(siteType: SiteType) {
  const spec = SPECS[siteType]
  const days = dates()
  const conversionEvents: Row[] = []
  const daily = days.map((date, i) => {
    const sessions = Math.round(spec.sessionsPerDay * wave(i, 0.3))
    let contacts = 0
    spec.rows.forEach((r, k) => {
      const n = Math.round(r.perDay * wave(i, k + 1))
      if (!n) return
      conversionEvents.push({ date, type: r.type, name: r.name, stage: r.stage, path: r.path, conversions: n, sessions: n })
      if (r.stage === 'confirmada' && ['contato', 'orcamento', 'agendamento'].includes(r.type)) contacts += n
    })
    const wa = Math.round(spec.whatsapp * wave(i, 9))
    if (wa) conversionEvents.push({ date, type: 'whatsapp', name: 'Fale no WhatsApp', stage: 'confirmada', path: '/', conversions: wa, sessions: wa })
    return { date, sessions, pageViews: Math.round(sessions * 2.3), users: Math.round(sessions * 0.85), contacts: contacts + wa }
  })
  const sum = (f: (r: Row) => boolean) => conversionEvents.filter(f).reduce((s, r) => s + r.conversions, 0)
  const sessions = daily.reduce((s, d) => s + d.sessions, 0)
  const whatsappContacts = sum(r => r.type === 'whatsapp')
  const formSubmits = sum(r => ['contato', 'orcamento', 'agendamento'].includes(r.type) && r.stage === 'confirmada')
  const signUps = Math.round(spec.signUps * DAYS)
  const contacts = whatsappContacts + formSubmits + signUps
  const totals = { sessions, users: Math.round(sessions * 0.85), newUsers: Math.round(sessions * 0.6), pageViews: Math.round(sessions * 2.3), contacts, contactSessions: Math.round(contacts * 0.9), whatsappContacts, signUps, formSubmits, logins: Math.round(spec.logins * DAYS) }
  const previousTotals = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round(Number(v) * 0.88)]))
  const paths = [...new Set(conversionEvents.map(r => r.path))]
  return {
    totals, previousTotals, daily, conversionEvents,
    pages: paths.map(path => ({ path, title: TITLES[path] || path, views: 100 })),
    sources: [{ name: 'Google', value: 48 }, { name: 'Instagram', value: 22 }, { name: 'Direto', value: 30 }],
    contactDetails: conversionEvents.filter(r => r.type === 'whatsapp').map(r => ({ date: r.date, type: 'whatsapp', path: r.path, contacts: r.conversions })),
    clickDetails: conversionEvents.filter(r => ['whatsapp', 'telefone'].includes(r.type)).map(r => ({ date: r.date, path: r.path, label: r.name, destination: r.type === 'whatsapp' ? 'https://wa.me/5511999999999' : 'tel:', intent: r.type, isContactLead: 1, clicks: r.conversions, sessions: r.sessions })),
    pageConversionResults: paths.map(path => ({ path, sessions: Math.round(sessions / paths.length), whatsappClicks: sum(r => r.path === path && r.type === 'whatsapp'), signUps: 0, contactSessions: sum(r => r.path === path && r.stage === 'confirmada') })),
    sourceMediumResults: [
      { source: 'google', medium: 'organic', campaign: '', sessions: Math.round(sessions * 0.48), users: 0, pageViews: 0, generalClicks: 40, contactClicks: Math.round(contacts * 0.5), whatsappClicks: Math.round(whatsappContacts * 0.5), conversions: Math.round(contacts * 0.5) },
      { source: 'instagram', medium: 'social', campaign: 'novembro', sessions: Math.round(sessions * 0.22), users: 0, pageViews: 0, generalClicks: 18, contactClicks: Math.round(contacts * 0.3), whatsappClicks: Math.round(whatsappContacts * 0.3), conversions: Math.round(contacts * 0.3) },
      { source: '(direct)', medium: '(none)', campaign: '', sessions: Math.round(sessions * 0.3), users: 0, pageViews: 0, generalClicks: 22, contactClicks: Math.round(contacts * 0.2), whatsappClicks: Math.round(whatsappContacts * 0.2), conversions: Math.round(contacts * 0.2) },
    ],
    periodDays: DAYS,
    sourceKind: 'tracker',
  }
}
