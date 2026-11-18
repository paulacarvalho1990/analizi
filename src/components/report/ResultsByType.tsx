// Página Resultados para sites que não são de captação de contatos
// (loja, SaaS, agendamento, reservas, conteúdo). Mesmo kit visual da página de Serviços.
// Os números vêm de conversionEvents, que o Worker consolida por tipo e etapa.
import { useMemo, useState, type ReactNode } from 'react'
import { TrendingDown } from 'lucide-react'
import * as R from './kit'
import { Help } from './kit'
import type { SiteType } from '../../lib/siteTypes'

export type ConversionRow = { date: string, type: string, name: string, stage: 'confirmada' | 'intencao', path: string, conversions: number, sessions: number }
export type ResultsData = {
  totals?: { sessions?: number, whatsappContacts?: number, signUps?: number, logins?: number }
  daily?: Array<{ date: string, sessions?: number }>
  conversionEvents?: ConversionRow[]
  pages?: Array<{ path: string, title?: string }>
}

type Match = { type: string | string[], stage?: 'confirmada' | 'intencao', name?: RegExp }
type Step = { label: string, match: Match | 'visits' }
type Part = { label: string, color: string, match: Match }
type TypeModel = {
  title: string
  subtitle: string
  guide: ReactNode
  primary: { label: string, unit: string, match: Match, help: string }
  /** Etapas do caminho até o resultado (loja, SaaS, conteúdo). */
  steps?: Step[]
  /** Por onde o resultado começa (agendamento, reservas). */
  parts?: Part[]
  minis: Array<{ label: string, small: string, match: Match | 'whatsapp' | 'logins', help: string }>
  intent: { label: string, match: Match }
  tipLow: string
  tipHigh: string
}

const PINK = '#FF3CAC', ORANGE = '#FF8A3D', BLUE = '#3B82F6', VIOLET = '#7C5CF0'

const MODELS: Record<Exclude<SiteType, 'servicos'>, TypeModel> = {
  ecommerce: {
    title: 'Resultados da loja',
    subtitle: 'O caminho dos visitantes até a compra.',
    guide: <><b>Como ler esta tela:</b> <b>compra</b> é quando a pessoa chega à página de pedido confirmado. O <b>caminho até a compra</b> mostra em que etapa mais gente desiste: é ali que vale melhorar primeiro.</>,
    primary: { label: 'Compras', unit: 'compras', match: { type: 'compra', stage: 'confirmada' }, help: 'Visitas à página de pedido confirmado. Cada pedido conta uma vez.' },
    steps: [
      { label: 'Visitaram a loja', match: 'visits' },
      { label: 'Foram ao carrinho', match: { type: ['carrinho', 'carrinho_visita'] } },
      { label: 'Iniciaram o checkout', match: { type: 'checkout' } },
      { label: 'Compraram', match: { type: 'compra', stage: 'confirmada' } },
    ],
    minis: [
      { label: 'Adições ao carrinho', small: 'cliques em adicionar', match: { type: 'carrinho' }, help: 'Cliques em botões como “Adicionar ao carrinho”.' },
      { label: 'Checkouts iniciados', small: 'começaram a finalizar', match: { type: 'checkout' }, help: 'Pessoas que abriram o checkout ou clicaram em finalizar compra.' },
      { label: 'Pagamentos iniciados', small: 'Pix, boleto ou cartão', match: { type: 'pagamento' }, help: 'Cliques em pagar, gerar Pix ou boleto.' },
      { label: 'WhatsApp', small: 'conversas iniciadas', match: 'whatsapp', help: 'Cliques em botões e links do WhatsApp.' },
    ],
    intent: { label: 'Checkouts iniciados', match: { type: 'checkout' } },
    tipLow: 'Confira se a página de pedido confirmado tem um endereço próprio, como /pedido-confirmado. É por ela que contamos as compras.',
    tipHigh: 'Quem abandona o checkout costuma travar no frete ou nas formas de pagamento. Mostre o frete ainda na página do produto.',
  },
  saas: {
    title: 'Resultados do produto',
    subtitle: 'Quem se cadastra, volta a usar e assina.',
    guide: <><b>Como ler esta tela:</b> <b>assinatura</b> é quando a pessoa chega à página de assinatura confirmada. <b>Cadastros</b> e <b>cliques para assinar</b> mostram o interesse antes do pagamento.</>,
    primary: { label: 'Assinaturas', unit: 'assinaturas', match: { type: 'assinatura', stage: 'confirmada' }, help: 'Visitas à página de assinatura confirmada ou upgrade concluído.' },
    steps: [
      { label: 'Visitaram o site', match: 'visits' },
      { label: 'Criaram conta', match: { type: 'cadastro' } },
      { label: 'Clicaram para assinar', match: { type: 'assinatura', stage: 'intencao' } },
      { label: 'Assinaram', match: { type: 'assinatura', stage: 'confirmada' } },
    ],
    minis: [
      { label: 'Cadastros', small: 'contas criadas', match: { type: 'cadastro' }, help: 'Cliques em criar conta ou começar teste grátis.' },
      { label: 'Logins', small: 'acessos à conta', match: 'logins', help: 'Acessos à área logada do produto.' },
      { label: 'Cliques para assinar', small: 'abriram o pagamento', match: { type: 'assinatura', stage: 'intencao' }, help: 'Cliques em assinar, escolher plano ou fazer upgrade.' },
      { label: 'WhatsApp', small: 'conversas iniciadas', match: 'whatsapp', help: 'Cliques em botões e links do WhatsApp.' },
    ],
    intent: { label: 'Cliques para assinar', match: { type: 'assinatura', stage: 'intencao' } },
    tipLow: 'Confira se, depois do pagamento, a pessoa volta para uma página própria, como /assinatura-confirmada. É por ela que contamos as assinaturas.',
    tipHigh: 'Muita gente cria conta e não assina? Mostre o valor do produto nos primeiros minutos de uso, antes de pedir o pagamento.',
  },
  conteudo: {
    title: 'Resultados do conteúdo',
    subtitle: 'Como o seu conteúdo vira leitores, inscritos e vendas.',
    guide: <><b>Como ler esta tela:</b> <b>downloads</b> são materiais baixados no site (PDF, e-book, catálogo). O caminho mostra quantos leitores chegam a se cadastrar e a comprar.</>,
    primary: { label: 'Downloads', unit: 'downloads', match: { type: 'download' }, help: 'Arquivos baixados no site, como PDFs, e-books e catálogos.' },
    steps: [
      { label: 'Leram o conteúdo', match: 'visits' },
      { label: 'Baixaram um material', match: { type: 'download' } },
      { label: 'Se cadastraram', match: { type: ['cadastro', 'newsletter'] } },
      { label: 'Compraram', match: { type: 'compra', stage: 'confirmada' } },
    ],
    minis: [
      { label: 'Cadastros', small: 'inscritos e contas', match: { type: ['cadastro', 'newsletter'] }, help: 'Cadastros, inscrições e newsletter.' },
      { label: 'Cliques para comprar', small: 'abriram o checkout', match: { type: ['checkout', 'pagamento', 'assinatura'], stage: 'intencao' }, help: 'Cliques que levam ao checkout do produto (Hotmart, Kiwify, Stripe…).' },
      { label: 'Compras', small: 'vendas confirmadas', match: { type: ['compra', 'assinatura'], stage: 'confirmada' }, help: 'Visitas à página de compra ou assinatura confirmada.' },
      { label: 'WhatsApp', small: 'conversas iniciadas', match: 'whatsapp', help: 'Cliques em botões e links do WhatsApp.' },
    ],
    intent: { label: 'Cliques para comprar', match: { type: ['checkout', 'pagamento', 'assinatura'], stage: 'intencao' } },
    tipLow: 'Ofereça um material gratuito (checklist, e-book) no meio dos conteúdos mais lidos, não só no fim da página.',
    tipHigh: 'Quem baixa um material já confia em você. Inclua no material um convite claro para o produto pago.',
  },
  agendamento: {
    title: 'Resultados de agendamento',
    subtitle: 'Quantas pessoas tentaram marcar um horário pelo site.',
    guide: <><b>Como ler esta tela:</b> <b>pedidos de agendamento</b> somam os cliques na agenda online, os formulários de agendamento e as confirmações. O WhatsApp e o telefone aparecem à parte, porque muita gente agenda por eles.</>,
    primary: { label: 'Pedidos de agendamento', unit: 'pedidos', match: { type: 'agendamento' }, help: 'Cliques na agenda online, formulários de agendamento e páginas de agendamento confirmado.' },
    parts: [
      { label: 'Agenda online', color: PINK, match: { type: 'agendamento', stage: 'intencao' } },
      { label: 'Agendamento confirmado', color: ORANGE, match: { type: 'agendamento', stage: 'confirmada' } },
      { label: 'WhatsApp', color: VIOLET, match: { type: 'whatsapp' } },
      { label: 'Telefone', color: BLUE, match: { type: 'telefone' } },
    ],
    minis: [
      { label: 'Cliques na agenda', small: 'Calendly, Google Agenda…', match: { type: 'agendamento', stage: 'intencao' }, help: 'Cliques em links de agenda online.' },
      { label: 'Agendamentos confirmados', small: 'formulário ou página de confirmação', match: { type: 'agendamento', stage: 'confirmada' }, help: 'Formulários de agendamento enviados e páginas de agendamento confirmado.' },
      { label: 'Cliques para ligar', small: 'ligações iniciadas', match: { type: 'telefone' }, help: 'Cliques em números de telefone.' },
      { label: 'WhatsApp', small: 'conversas iniciadas', match: 'whatsapp', help: 'Cliques em botões e links do WhatsApp.' },
    ],
    intent: { label: 'Cliques na agenda', match: { type: 'agendamento', stage: 'intencao' } },
    tipLow: 'Coloque o botão de agendar no topo da página, visível no celular, com os próximos horários livres.',
    tipHigh: 'Responda rápido quem pede horário pelo WhatsApp: na primeira hora a pessoa ainda está decidindo.',
  },
  reservas: {
    title: 'Resultados de reservas',
    subtitle: 'As reservas e os pedidos de disponibilidade do seu site.',
    guide: <><b>Como ler esta tela:</b> <b>cliques para reservar</b> são as pessoas que abriram o motor de reservas. <b>Reservas confirmadas</b> são as que chegaram à página de confirmação. WhatsApp e telefone aparecem à parte.</>,
    primary: { label: 'Interessados em reservar', unit: 'pedidos', match: { type: 'reserva' }, help: 'Cliques no motor de reservas e páginas de reserva confirmada.' },
    parts: [
      { label: 'Motor de reservas', color: PINK, match: { type: 'reserva', stage: 'intencao' } },
      { label: 'Reserva confirmada', color: ORANGE, match: { type: 'reserva', stage: 'confirmada' } },
      { label: 'WhatsApp', color: VIOLET, match: { type: 'whatsapp' } },
      { label: 'Telefone', color: BLUE, match: { type: 'telefone' } },
    ],
    minis: [
      { label: 'Cliques para reservar', small: 'Booking, Omnibees, Sympla…', match: { type: 'reserva', stage: 'intencao' }, help: 'Cliques em links de motores de reserva.' },
      { label: 'Reservas confirmadas', small: 'página de confirmação', match: { type: 'reserva', stage: 'confirmada' }, help: 'Visitas à página de reserva confirmada.' },
      { label: 'Cliques para ligar', small: 'ligações iniciadas', match: { type: 'telefone' }, help: 'Cliques em números de telefone.' },
      { label: 'WhatsApp', small: 'conversas iniciadas', match: 'whatsapp', help: 'Cliques em botões e links do WhatsApp.' },
    ],
    intent: { label: 'Cliques para reservar', match: { type: 'reserva', stage: 'intencao' } },
    tipLow: 'Mostre a disponibilidade dos próximos dias e o botão de reservar logo no topo da página.',
    tipHigh: 'Quem abre o motor de reservas e não conclui costuma desistir pelo preço final. Mostre taxas e políticas antes.',
  },
}

const types = (m: Match) => (Array.isArray(m.type) ? m.type : [m.type])
const matches = (row: ConversionRow, m: Match) => types(m).includes(row.type) && (!m.stage || row.stage === m.stage) && (!m.name || m.name.test(row.name))
const ITEMS = 10

export function ResultsByType({ siteType, data, header, filters }: { siteType: Exclude<SiteType, 'servicos'>, data: ResultsData | null, header: (title: string, subtitle: string, guide: ReactNode) => ReactNode, filters: ReactNode }) {
  const model = MODELS[siteType]
  const rows = data?.conversionEvents ?? []
  const sessions = Number(data?.totals?.sessions || 0)
  const total = (m: Match) => rows.filter(r => matches(r, m)).reduce((s, r) => s + Number(r.conversions || 0), 0)
  const people = (m: Match) => rows.filter(r => matches(r, m)).reduce((s, r) => s + Number(r.sessions || 0), 0)
  const whatsapp = Number(data?.totals?.whatsappContacts || 0) || total({ type: 'whatsapp' })
  const miniValue = (m: TypeModel['minis'][number]['match']) => m === 'whatsapp' ? whatsapp : m === 'logins' ? Number(data?.totals?.logins || 0) : total(m)
  const partValue = (p: Part) => (types(p.match).includes('whatsapp') ? whatsapp : total(p.match))

  const primary = total(model.primary.match)
  const rate = sessions ? (people(model.primary.match) / sessions) * 100 : 0
  const pageTitle = (path: string) => data?.pages?.find(p => p.path === path)?.title || (path === '/' ? 'Página inicial' : path)

  // Etapas: pessoas (sessões) em cada etapa; a de maior perda fica destacada.
  // Uma etapa com vários tipos (ex.: adicionou ao carrinho / visitou o carrinho) usa o maior, para não contar a mesma pessoa duas vezes.
  const stepPeople = (m: Match) => Math.max(0, ...types(m).map(type => people({ ...m, type })))
  const steps = (model.steps ?? []).map(step => ({ label: step.label, value: step.match === 'visits' ? sessions : stepPeople(step.match) }))
  const drops = steps.slice(1).map((s, i) => (steps[i].value ? 1 - s.value / steps[i].value : 0))
  const worst = drops.length && Math.max(...drops) > 0 ? drops.indexOf(Math.max(...drops)) + 1 : -1

  const parts = (model.parts ?? []).map(p => ({ ...p, value: partValue(p) }))
  const partsTotal = parts.reduce((s, p) => s + p.value, 0)

  // Série diária: resultado confirmado x intenção.
  const daily = data?.daily ?? []
  const byDate = (m: Match) => { const map = new Map<string, number>(); rows.filter(r => matches(r, m)).forEach(r => map.set(r.date, (map.get(r.date) || 0) + Number(r.conversions || 0))); return map }
  const primaryByDate = byDate(model.primary.match)
  const intentByDate = byDate(model.intent.match)
  const sameSeries = JSON.stringify(types(model.primary.match)) === JSON.stringify(types(model.intent.match)) && !model.primary.match.stage
  const bestDay = daily.reduce<{ date: string, v: number } | null>((best, d) => { const v = primaryByDate.get(d.date) || 0; return v > (best?.v || 0) ? { date: d.date, v } : best }, null)

  // Páginas e botões que mais geram o resultado (todas as etapas do tipo principal e da intenção).
  // Loja: a tabela mostra só o que leva à compra (sem carrinho e checkout, que já estão no caminho).
  const hidden = siteType === 'ecommerce' ? ['carrinho', 'carrinho_visita', 'checkout'] : []
  const relevant = (r: ConversionRow) => !hidden.includes(r.type) && (matches(r, model.primary.match) || matches(r, model.intent.match) || (model.steps ?? []).some(s => s.match !== 'visits' && matches(r, s.match)))
  const [tab, setTab] = useState<'pages' | 'actions'>('pages')
  const [page, setPage] = useState(0)
  const grouped = useMemo(() => {
    const map = new Map<string, { key: string, label: string, sub: string, confirmed: number, intent: number }>()
    rows.filter(relevant).forEach(r => {
      const key = tab === 'pages' ? r.path : `${r.name}|${r.type}`
      const cur = map.get(key) || { key, label: tab === 'pages' ? pageTitle(r.path) : (r.name || 'Sem nome'), sub: tab === 'pages' ? r.path : r.path, confirmed: 0, intent: 0 }
      if (r.stage === 'confirmada') cur.confirmed += Number(r.conversions || 0); else cur.intent += Number(r.conversions || 0)
      map.set(key, cur)
    })
    return [...map.values()].sort((a, b) => (b.confirmed + b.intent) - (a.confirmed + a.intent) || b.confirmed - a.confirmed)
  }, [rows, tab, siteType]) // eslint-disable-line react-hooks/exhaustive-deps
  const maxGrouped = Math.max(...grouped.map(g => g.confirmed + g.intent), 1)

  return (
    <>
      {header(model.title, model.subtitle, model.guide)}
      {filters}
      <div className="rp">
        <div className="rp-grid rp-g-main">
          <R.Card title={model.primary.label} subtitle="No período selecionado" help={{ what: model.primary.help }}
            read={primary ? <>De cada 100 visitas, <b>{R.fmtDec(rate)}</b> terminaram em {model.primary.unit === 'pedidos' ? 'pedido' : model.primary.unit.replace(/s$/, '')}.</> : undefined}
            tip={primary ? model.tipHigh : model.tipLow}>
            <div className="rp-big"><b className="num">{R.fmt(primary)}</b><span>{model.primary.unit} · <b style={{ color: 'var(--rp-fg)' }}>{sessions ? R.fmtPct(rate) : '—'}</b> das visitas</span></div>
            <div className="rp-grid rp-g2e" style={{ marginTop: 12, gap: 10 }}>
              {model.minis.map(m => { const v = miniValue(m.match); return (
                <div key={m.label} className="rp-mini"><span className="t">{m.label}<Help title={m.label} what={m.help} /></span><b className={`num ${v ? '' : 'empty'}`}>{v ? R.fmt(v) : '—'}</b><small>{m.small}</small></div>
              ) })}
            </div>
          </R.Card>

          {steps.length > 0 ? (
            <R.Card title={`Caminho até ${model.primary.label.toLowerCase()}`} subtitle="Pessoas em cada etapa" help={{ what: 'Cada etapa conta as visitas que chegaram até ali. A porcentagem compara com a etapa anterior.', tip: 'Comece melhorando a etapa com a maior perda.' }}
              read={worst > 0 ? <>A maior perda está entre <b>{steps[worst - 1].label.toLowerCase()}</b> e <b>{steps[worst].label.toLowerCase()}</b>.</> : undefined}>
              <ol className="rp-path">
                {steps.map((s, i) => (
                  <li key={s.label} className={i === worst ? 'worst' : ''}>
                    <div className="rp-path-row"><span>{s.label}</span><b className="num">{R.fmt(s.value)}</b></div>
                    <div className="rp-path-track"><i style={{ width: `${steps[0].value ? Math.max(2, (s.value / steps[0].value) * 100) : 0}%` }} /></div>
                    {i > 0 && <small>{i === worst && <TrendingDown size={13} />}{steps[i - 1].value ? R.fmtPct((s.value / steps[i - 1].value) * 100) : '—'} da etapa anterior{i === worst ? ' · maior perda' : ''}</small>}
                  </li>
                ))}
              </ol>
            </R.Card>
          ) : (
            <R.Card title={siteType === 'reservas' ? 'Como as pessoas tentam reservar' : 'Como as pessoas tentam agendar'} subtitle="Incluindo WhatsApp e telefone" help={{ what: 'Mostra se as pessoas preferem a agenda ou motor de reservas, o WhatsApp ou o telefone.' }}
              read={partsTotal ? (() => { const top = [...parts].sort((a, b) => b.value - a.value)[0]; return <><b>{top.label}</b> responde por <b>{Math.round(R.share(top.value, partsTotal))}%</b> das tentativas.</> })() : undefined}>
              {partsTotal ? (
                <><R.StackBar height={14} segments={parts.map(p => ({ value: p.value, color: p.color, label: p.label }))} /><ul className="rp-parts" style={{ marginTop: 14 }}>
                  {parts.map(p => (
                    <li key={p.label}><i style={{ background: p.color }} /><span>{p.label}</span><b className="num">{R.fmt(p.value)}</b><small>{R.fmtPct(R.share(p.value, partsTotal), 0)}</small></li>
                  ))}
                </ul></>
              ) : <R.Empty>Nenhuma tentativa no período.</R.Empty>}
            </R.Card>
          )}
        </div>

        <div className="rp-grid">
          <R.Card title={`${model.primary.label} ao longo do período`} subtitle="Passe o mouse em cada barra para ver os detalhes do dia"
            actions={<div className="rp-legend"><span><i style={{ background: PINK }} />{model.primary.label}</span>{!sameSeries && <span><i style={{ background: ORANGE }} />{model.intent.label}</span>}</div>}
            read={bestDay ? <>O melhor dia foi <b>{R.shortDate(bestDay.date)} ({R.WEEKDAYS[R.weekdayOf(bestDay.date)]})</b>, com {R.fmt(bestDay.v)} {model.primary.unit}.</> : undefined}>
            <R.StackedBars unit={model.primary.unit} labels={daily.map(d => R.shortDate(d.date))}
              series={sameSeries
                ? [{ name: model.primary.unit, color: PINK, values: daily.map(d => primaryByDate.get(d.date) || 0) }]
                : [{ name: model.primary.label.toLowerCase(), color: PINK, values: daily.map(d => primaryByDate.get(d.date) || 0) }, { name: model.intent.label.toLowerCase(), color: ORANGE, values: daily.map(d => intentByDate.get(d.date) || 0) }]} />
          </R.Card>
        </div>

        <div className="rp-grid">
          <R.Card title={tab === 'pages' ? `Páginas que mais geram ${model.primary.label.toLowerCase()}` : 'Botões e formulários que mais geram resultado'}
            subtitle="Confirmados e iniciados em cada página"
            help={{ what: '“Confirmados” chegaram ao fim (pedido, assinatura, reserva). “Iniciados” começaram, mas não sabemos se terminaram.' }}
            actions={<R.Tabs label="Ver por" value={tab} onChange={(v) => { setTab(v); setPage(0) }} options={[{ value: 'pages', label: 'Por página' }, { value: 'actions', label: 'Por botão' }]} />}
            read={grouped[0] ? <><b>{grouped[0].label}</b> concentra mais ações ligadas a {model.primary.label.toLowerCase()}.</> : undefined}>
            {grouped.length ? (
              <div className="rp-tw"><table className="rp-t">
                <thead><tr><th>{tab === 'pages' ? 'Página' : 'Botão ou formulário'}</th><th>Total</th><th className="r">Confirmados</th><th className="r">Iniciados</th></tr></thead>
                <tbody>{grouped.slice(page * ITEMS, (page + 1) * ITEMS).map(g => (
                  <tr key={g.key}>
                    <td className="pg"><b>{g.label}</b><code>{g.sub}</code></td>
                    <td><R.CellBar tone="pink" value={g.confirmed + g.intent} max={maxGrouped} /></td>
                    <td className="r num">{g.confirmed ? R.fmt(g.confirmed) : '—'}</td>
                    <td className="r num">{g.intent ? R.fmt(g.intent) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <R.Empty>Ainda não há resultados registrados neste período.</R.Empty>}
            <R.Pager page={page} total={grouped.length} perPage={ITEMS} setPage={setPage} />
          </R.Card>
        </div>
      </div>
    </>
  )
}
