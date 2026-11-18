import type { ReactNode } from 'react'
import './weekly-report.css'

/* Relatórios one-page para leigos: poucas figuras, uma frase cada.
   Só usa campos que já existem em AnalyticsData (src/App.tsx). */

import type { ReportInsight } from '../../reports/insights'
import { CONTACT_LABEL, WEEKDAYS, derive, exitPct, fmt, inTen, n, views, weekdayOf, type Derived, type ReportData, type ReportKind } from '../../reports/derive'
export type { ReportData, ReportKind }

const dateBR = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')

function Delta({ now, before, unit = '%' }: { now: number, before?: number, unit?: '%' | 'abs' }) {
  if (before === undefined || (!before && !now)) return null
  if (!before) return <span className="wr-delta up">novo</span>
  const diff = unit === 'abs' ? now - before : Math.round(((now - before) / before) * 100)
  const cls = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  const label = unit === 'abs' ? `${diff > 0 ? '+' : ''}${fmt(diff)}` : `${Math.abs(diff)}%`
  return <span className={`wr-delta ${cls}`}>{diff > 0 ? '▲' : diff < 0 ? '▼' : '='} {label} vs. semana anterior</span>
}

/* ---------- figuras ---------- */
type Tone = 'pink' | 'blue' | 'orange' | 'good' | 'bad'
const People = ({ on, color }: { on: number, color: string }) => (
  <svg viewBox="0 0 120 64" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => {
    const f = i < on ? color : 'var(--wr-track)'
    return <g key={i}><circle cx={12 + i * 12} cy={22} r={5} fill={f} /><path d={`M${6 + i * 12} 44c0-7 3-12 6-12s6 5 6 12z`} fill={f} /></g>
  })}</svg>
)
const Pin = () => <svg viewBox="0 0 120 64" aria-hidden="true"><ellipse cx="60" cy="56" rx="26" ry="5" fill="var(--wr-track)" /><path d="M60 8c-11 0-19 8-19 18 0 13 19 30 19 30s19-17 19-30c0-10-8-18-19-18z" fill="var(--wr-orange)" /><circle cx="60" cy="26" r="7" fill="var(--wr-surface)" /></svg>
const Clock = ({ hour }: { hour: number }) => {
  const a = ((hour % 12) / 12) * Math.PI * 2 - Math.PI / 2
  return <svg viewBox="0 0 120 64" aria-hidden="true"><circle cx="60" cy="32" r="26" fill="var(--wr-surface)" stroke="var(--wr-pink)" strokeOpacity=".4" strokeWidth="2" /><line x1="60" y1="32" x2={60 + Math.cos(a) * 15} y2={32 + Math.sin(a) * 15} stroke="var(--wr-primary)" strokeWidth="3.5" strokeLinecap="round" /><line x1="60" y1="32" x2="60" y2="12" stroke="var(--wr-fg)" strokeWidth="2.5" strokeLinecap="round" /><circle cx="60" cy="32" r="3" fill="var(--wr-fg)" /></svg>
}
const Phone = () => <svg viewBox="0 0 120 64" aria-hidden="true"><rect x="46" y="4" width="28" height="56" rx="6" fill="none" stroke="var(--wr-blue)" strokeWidth="3" /><rect x="51" y="11" width="18" height="38" rx="2" fill="var(--wr-blue)" opacity=".18" /><circle cx="60" cy="54" r="2" fill="var(--wr-blue)" /></svg>
const PageCheck = () => <svg viewBox="0 0 120 64" aria-hidden="true"><rect x="40" y="4" width="40" height="54" rx="5" fill="var(--wr-surface)" stroke="var(--wr-border)" strokeWidth="2" /><rect x="47" y="13" width="26" height="4" rx="2" fill="var(--wr-faint)" /><rect x="47" y="22" width="20" height="4" rx="2" fill="var(--wr-track)" /><rect x="47" y="30" width="23" height="4" rx="2" fill="var(--wr-track)" /><rect x="47" y="42" width="26" height="9" rx="4.5" fill="var(--wr-primary)" /><circle cx="82" cy="10" r="9" fill="var(--wr-good)" /><path d="M78 10l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Exit = () => <svg viewBox="0 0 120 64" aria-hidden="true"><rect x="34" y="6" width="34" height="52" rx="4" fill="none" stroke="var(--wr-border)" strokeWidth="2.5" /><path d="M58 32h40m-9-9 9 9-9 9" fill="none" stroke="var(--wr-bad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Bubble = () => <svg viewBox="0 0 120 64" aria-hidden="true"><path d="M30 10h60a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H56l-14 10v-10H30a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z" fill="var(--wr-surface)" stroke="var(--wr-good)" strokeWidth="2.5" /><circle cx="46" cy="29" r="3.5" fill="var(--wr-good)" /><circle cx="60" cy="29" r="3.5" fill="var(--wr-good)" /><circle cx="74" cy="29" r="3.5" fill="var(--wr-good)" /></svg>
const Search = () => <svg viewBox="0 0 120 64" aria-hidden="true"><circle cx="54" cy="28" r="18" fill="none" stroke="var(--wr-blue)" strokeWidth="4" /><line x1="67" y1="41" x2="82" y2="56" stroke="var(--wr-blue)" strokeWidth="5" strokeLinecap="round" /></svg>
const NewPerson = () => <svg viewBox="0 0 120 64" aria-hidden="true"><circle cx="48" cy="22" r="9" fill="var(--wr-pink)" /><path d="M32 54c0-11 7-18 16-18s16 7 16 18z" fill="var(--wr-pink)" /><circle cx="84" cy="18" r="11" fill="var(--wr-good)" /><path d="M84 12v12m-6-6h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
const Week = ({ values, color }: { values: number[], color: string }) => {
  const m = Math.max(1, ...values)
  const best = values.indexOf(Math.max(...values))
  const w = Math.min(10, 100 / Math.max(values.length, 1) - 4)
  const step = 108 / Math.max(values.length, 1)
  return <svg viewBox="0 0 120 64" aria-hidden="true">{values.map((v, i) => <rect key={i} x={8 + i * step} y={56 - (v / m) * 44} width={w} height={Math.max(1, (v / m) * 44)} rx="3" fill={i === best ? color : 'var(--wr-track)'} />)}<line x1="4" y1="57" x2="116" y2="57" stroke="var(--wr-border)" /></svg>
}

type Fact = { tone: Tone, figure: ReactNode, text: ReactNode }
type Step = { value: string, what: string, explain: string, delta?: ReactNode, hero?: boolean }
type Model = { title: string, subtitle: string, headline: string, steps: Step[], plain?: ReactNode, facts: Fact[] }

/* ---------- figuras reutilizadas entre relatórios ---------- */
const fact = {
  topSource: (x: Derived): Fact | null => { const s = x.sourceList[0]; return s && x.sourceTotal ? { tone: 'pink', figure: <People on={Math.max(1, Math.round(s[1] / x.sourceTotal * 9))} color="var(--wr-pink)" />, text: <><b>{inTen(s[1], x.sourceTotal)} visitas</b> vieram de <b>{s[0]}</b>, o lugar que mais trouxe gente.</> } : null },
  topCity: (x: Derived): Fact | null => { const c = x.cityList[0]; return c ? { tone: 'orange', figure: <Pin />, text: <>A cidade que mais visitou foi <b>{c[0]}</b>, com {fmt(c[1].users)} pessoas.</> } : null },
  peak: (x: Derived): Fact | null => x.peak && (n(x.peak.contacts) || n(x.peak.views)) ? { tone: 'pink', figure: <Clock hour={x.peak.hourOfDay} />, text: n(x.peak.contacts) ? <>O melhor horário foi <b>{WEEKDAYS[x.peak.dayOfWeek]}, das {x.peak.hourOfDay}h às {x.peak.hourOfDay + 1}h</b>: foi quando mais gente chamou você.</> : <>O horário mais movimentado foi <b>{WEEKDAYS[x.peak.dayOfWeek]}, das {x.peak.hourOfDay}h às {x.peak.hourOfDay + 1}h</b>.</> } : null,
  mobile: (x: Derived): Fact | null => x.devTotal ? { tone: 'blue', figure: <Phone />, text: <><b>{inTen(x.mobile, x.devTotal)} pessoas</b> usaram o celular.{x.mobile / x.devTotal >= 0.5 ? ' Vale sempre conferir o site no celular.' : ''}</> } : null,
  topContactPage: (x: Derived): Fact | null => { const pg = x.pageContacts[0]; return pg && pg.c ? { tone: 'pink', figure: <PageCheck />, text: <>A página que mais trouxe contatos foi <b>{x.pageTitle(pg.path)}</b>: {fmt(pg.c)} de {fmt(x.contacts)}.</> } : null },
  bestViewsDay: (x: Derived, color = 'var(--wr-blue)'): Fact | null => x.bestViews && n(x.bestViews.pageViews) ? { tone: color.includes('pink') ? 'pink' : 'blue', figure: <Week values={x.daily.map(r => n(r.pageViews))} color={color} />, text: <>O dia com mais visitas foi <b>{weekdayOf(x.bestViews.date)}</b>, com {fmt(n(x.bestViews.pageViews))}.</> } : null,
  bestContactsDay: (x: Derived): Fact | null => x.bestContacts && n(x.bestContacts.contacts) ? { tone: 'pink', figure: <Week values={x.daily.map(r => n(r.contacts))} color="var(--wr-pink)" />, text: <>O dia com mais contatos foi <b>{weekdayOf(x.bestContacts.date)}</b>, com {fmt(n(x.bestContacts.contacts))}.</> } : null,
  leak: (x: Derived): Fact | null => x.leak ? { tone: 'bad', figure: <Exit />, text: <><b>{inTen(exitPct(x.leak.exitRate), 100)} pessoas</b> saem da página <b>{x.pageTitle(x.leak.path)}</b> sem fazer mais nada.</> } : null,
}

/** Título do relatório geral: compara visitas e contatos sem afirmar o que não aconteceu. */
function generalHeadline(x: Derived) {
  const p = x.p
  if (!x.users) return 'O site ainda não recebeu visitas nesta semana.'
  if (!p) return x.contacts ? `${fmt(x.users)} pessoas visitaram o site e ${fmt(x.contacts)} pediram contato.` : `${fmt(x.users)} pessoas visitaram o site, mas ninguém pediu contato ainda.`
  const v = Math.sign(x.users - n(p.users)), c = Math.sign(x.contacts - n(p.contactClicks))
  if (x.contacts === 0) return v > 0 ? 'Mais gente visitou o site, mas ninguém pediu contato.' : 'Semana mais calma: ninguém pediu contato pelo site.'
  if (v > 0 && c > 0) return 'Mais gente visitou o site e mais gente chamou você.'
  if (v > 0 && c < 0) return 'Mais gente visitou o site, mas menos gente chamou você.'
  if (v < 0 && c > 0) return 'Menos visitas, mas mais gente chamou você.'
  if (v < 0 && c < 0) return 'Foi uma semana mais calma no site.'
  if (c > 0) return 'Mais gente chamou você nesta semana.'
  if (c < 0) return 'Menos gente chamou você nesta semana.'
  return v > 0 ? 'Mais gente visitou o site nesta semana.' : v < 0 ? 'O site teve menos visitas nesta semana.' : 'Uma semana parecida com a anterior.'
}

/* ---------- os 4 relatórios ---------- */
function build(kind: ReportKind, x: Derived): Model {
  const { t, p } = x
  const rate = x.users ? (x.contacts / x.users) * 100 : 0
  const prevRate = p && n(p.users) ? (n(p.contactClicks) / n(p.users)) * 100 : undefined
  const per100 = <>De cada <b>100 pessoas</b> que entraram no site, <b>{x.contacts && Math.round(rate) === 0 ? 'menos de 1' : Math.round(rate)} {Math.round(rate) === 1 ? 'pediu' : 'pediram'} contato</b>{prevRate !== undefined ? <>. Na semana anterior eram {Math.round(prevRate)}</> : null}.</>
  const topContactPage = x.pageContacts[0]

  if (kind === 'contatos') {
    const types = [...x.contactTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    const wa = x.contactTypes.get('whatsapp') || n(t.whatsappClicks)
    const diff = p ? x.contacts - n(p.contactClicks) : 0
    return {
      title: 'Relatório de contatos', subtitle: 'Quantas pessoas pediram contato pelo site, e como.',
      headline: x.contacts === 0 ? 'Ninguém pediu contato pelo site nesta semana.'
        : p && diff > 0 ? `Seu site trouxe ${fmt(x.contacts)} ${x.contacts === 1 ? 'pedido' : 'pedidos'} de contato, ${fmt(diff)} a mais que na semana anterior.`
        : p && diff < 0 ? `Seu site trouxe ${fmt(x.contacts)} ${x.contacts === 1 ? 'pedido' : 'pedidos'} de contato, ${fmt(-diff)} a menos que na semana anterior.`
        : `Seu site trouxe ${fmt(x.contacts)} ${x.contacts === 1 ? 'pedido' : 'pedidos'} de contato.`,
      steps: types.length ? types.map(([k, v], i) => ({ value: fmt(v), what: CONTACT_LABEL[k]?.[0] ?? k.replace(/_/g, ' '), explain: CONTACT_LABEL[k]?.[1] ?? 'Outro tipo de contato.', hero: i === 0 }))
        : [{ value: fmt(x.contacts), what: 'pediram contato', explain: 'Clicaram em WhatsApp, telefone ou e-mail.', delta: <Delta now={x.contacts} before={p ? n(p.contactClicks) : undefined} />, hero: true }],
      plain: per100,
      facts: [
        wa && x.contacts ? { tone: 'good', figure: <Bubble />, text: <><b>{inTen(wa, x.contacts)} contatos</b> chegaram pelo WhatsApp.</> } as Fact : null,
        fact.topContactPage(x), fact.peak(x),
        x.topContactSource && x.topContactSource[1] ? { tone: 'blue', figure: <Search />, text: <>Quem veio de <b>{x.topContactSource[0]}</b> foi quem mais chamou você: {fmt(x.topContactSource[1])} contatos.</> } as Fact : null,
        fact.bestContactsDay(x), fact.leak(x),
      ].filter(Boolean) as Fact[],
    }
  }

  if (kind === 'visitas') {
    const newU = n(t.newUsers), back = Math.max(0, x.users - newU)
    const [s1, s2, s3] = x.sourceList
    return {
      title: 'Relatório de visitas', subtitle: 'Quantas pessoas visitaram o site e por onde elas chegaram.',
      headline: x.users === 0 ? 'O site ainda não recebeu visitas nesta semana.' : newU > back ? `O site recebeu ${fmt(x.users)} pessoas, e a maioria nunca tinha visitado antes.` : `O site recebeu ${fmt(x.users)} pessoas, e a maioria já conhecia você.`,
      steps: [
        { value: fmt(x.users), what: 'pessoas visitaram', explain: 'Cada pessoa conta uma vez, mesmo se voltou.', delta: <Delta now={x.users} before={p ? n(p.users) : undefined} />, hero: true },
        { value: fmt(newU), what: 'vieram pela primeira vez', explain: 'Nunca tinham entrado no site.', delta: <Delta now={newU} before={p?.newUsers !== undefined ? n(p.newUsers) : undefined} /> },
        { value: fmt(back), what: 'voltaram', explain: 'Já conheciam o site.' },
      ],
      plain: x.users ? <>Cada pessoa olhou em média <b>{(x.pv / x.users).toFixed(1).replace('.', ',')} páginas</b> antes de sair.</> : undefined,
      facts: [
        fact.topSource(x),
        s2 ? { tone: 'blue', figure: <Search />, text: <><b>{fmt(s2[1])} visitas</b> vieram de <b>{s2[0]}</b>.</> } as Fact : null,
        s3 ? { tone: 'orange', figure: <People on={Math.max(1, Math.round(s3[1] / x.sourceTotal * 9))} color="var(--wr-orange)" />, text: <><b>{fmt(s3[1])} visitas</b> vieram de <b>{s3[0]}</b>.</> } as Fact : null,
        x.users ? { tone: 'pink', figure: <NewPerson />, text: <><b>{inTen(newU, x.users)} visitantes</b> eram novos{newU > back ? '. Seu site está alcançando gente nova' : ''}.</> } as Fact : null,
        x.topPages[0] ? { tone: 'pink', figure: <PageCheck />, text: <>A página mais vista foi <b>{x.pageTitle(x.topPages[0].path)}</b>, com {fmt(n(x.topPages[0].views))} visitas.</> } as Fact : null,
        fact.bestViewsDay(x),
      ].filter(Boolean) as Fact[],
    }
  }

  if (kind === 'regiao') {
    const [c1, c2, c3, c4] = x.cityList
    const topRegion = x.regionList[0]
    const bestConv = x.bestConvCity
    const outside = topRegion ? x.locTotal - topRegion[1] : 0
    const contactsTopCity = c1 ? c1[1].conv : 0
    return {
      title: 'Relatório por região', subtitle: 'De onde são as pessoas que visitam o seu site.',
      headline: c1 ? (bestConv && bestConv[0] !== c1[0] ? `A maior parte do seu público está em ${c1[0]}, mas ${bestConv[0]} chama mais.` : `A maior parte do seu público está em ${c1[0]}.`) : 'Ainda não sabemos de onde são seus visitantes.',
      steps: [
        { value: c1 ? fmt(c1[1].users) : '0', what: c1 ? `em ${c1[0]}` : 'na cidade principal', explain: c1 && x.users ? `${inTen(c1[1].users, x.users)} visitantes.` : 'Sem dados de cidade.', hero: true },
        { value: fmt(x.cityList.filter(([, c]) => c.users >= 10).length), what: 'cidades diferentes', explain: 'Com pelo menos 10 visitantes cada.' },
        { value: topRegion && x.locTotal ? `${Math.round(topRegion[1] / x.locTotal * 100)}%` : '0%', what: topRegion ? `em ${topRegion[0]}` : 'no estado principal', explain: 'O resto veio de outros estados.' },
      ],
      plain: topRegion && topRegion[1] / Math.max(1, x.locTotal) >= 0.7 ? <>Quase todo o seu público está <b>perto de você</b>. Isso é bom para quem atende presencialmente.</> : undefined,
      facts: [
        fact.topCity(x),
        c2 ? { tone: 'orange', figure: <People on={Math.min(9, [c2, c3, c4].filter(Boolean).length + 1)} color="var(--wr-orange)" />, text: <>Depois vêm {[c2, c3, c4].filter(Boolean).map((c, i, a) => <span key={c![0]}><b>{c![0]}</b>{i < a.length - 2 ? ', ' : i === a.length - 2 ? ' e ' : ''}</span>)}.</> } as Fact : null,
        bestConv && bestConv[1].conv ? { tone: 'orange', figure: <People on={Math.max(1, Math.round(bestConv[1].conv / bestConv[1].users * 9))} color="var(--wr-orange)" />, text: <>Em <b>{bestConv[0]}</b>, {inTen(bestConv[1].conv, bestConv[1].users)} visitantes pediram contato. É a cidade que mais chama.</> } as Fact : null,
        c1 && contactsTopCity ? { tone: 'good', figure: <Bubble />, text: <><b>{c1[0]}</b> trouxe {fmt(contactsTopCity)} dos {fmt(x.contacts)} contatos da semana.</> } as Fact : null,
        outside ? { tone: 'bad', figure: <Exit />, text: <><b>{fmt(outside)} pessoas</b> vieram de fora de {topRegion![0]}.</> } as Fact : null,
        fact.mobile(x),
      ].filter(Boolean) as Fact[],
    }
  }

  // geral
  return {
    title: 'Relatório da semana', subtitle: 'Como foi a semana do seu site, explicado sem termos técnicos.',
    headline: generalHeadline(x),
    steps: [
      { value: fmt(x.users), what: 'pessoas visitaram', explain: 'Cada pessoa conta uma vez, mesmo se voltou.', delta: <Delta now={x.users} before={p ? n(p.users) : undefined} /> },
      { value: fmt(x.pv), what: 'páginas vistas', explain: x.users ? `Em média, cada pessoa olhou ${(x.pv / x.users).toFixed(1).replace('.', ',')} páginas.` : 'Vezes que alguma página foi aberta.', delta: <Delta now={x.pv} before={p ? views(p) : undefined} /> },
      { value: fmt(x.contacts), what: 'pediram contato', explain: 'Clicaram em WhatsApp, telefone ou e-mail.', delta: <Delta now={x.contacts} before={p ? n(p.contactClicks) : undefined} />, hero: true },
    ],
    plain: per100,
    facts: [fact.topSource(x), fact.topCity(x), fact.peak(x), fact.mobile(x), fact.topContactPage(x), fact.bestContactsDay(x) ?? fact.bestViewsDay(x, 'var(--wr-pink)')].filter(Boolean) as Fact[],
  }
}

export function WeeklyReport({ kind, data, start, end, normalizeSource, insights, actions }: { kind: ReportKind, data: ReportData | null, start: string, end: string, normalizeSource: (s: string) => string, insights?: ReportInsight[], actions?: ReactNode }) {
  const model = data ? build(kind, derive(data, normalizeSource)) : null
  const period = start && end ? `${dateBR(start)} a ${dateBR(end)}` : ''
  return (
    <div className="wr">
      <header className="wr-top">
        <div><h1>{model?.title ?? 'Relatório'}</h1><p>{model?.subtitle ?? 'Carregando os dados do seu site…'}</p></div>
        <div className="wr-actions">
          {period && <span className="wr-period">{period}</span>}
          {actions}
          <button className="wr-btn" onClick={() => window.print()}>Imprimir ou salvar PDF</button>
        </div>
      </header>
      {!model ? <div className="wr-empty">Ainda não há dados para montar este relatório.</div> : <>
        <article className="wr-letter" aria-labelledby="wr-hl">
          <p className="wr-greet">Semana de {period}</p>
          <h2 id="wr-hl" className="wr-headline">{model.headline}</h2>
          <div className="wr-flow">
            {model.steps.map((s, i) => <div key={i} className="wr-flow-item">
              {i > 0 && <span className="wr-arrow" aria-hidden="true">→</span>}
              <div className={`wr-step${s.hero ? ' hero' : ''}`}>
                <strong>{s.value}</strong><span className="wr-what">{s.what}</span><span className="wr-explain">{s.explain}</span>{s.delta}
              </div>
            </div>)}
          </div>
          {model.plain && <p className="wr-plain">{model.plain}</p>}
        </article>
        {model.facts.length > 0 && <section className="wr-q">
          <h2>Os destaques da semana</h2>
          <div className="wr-facts">
            {model.facts.map((f, i) => <figure key={i} className="wr-fact"><div className={`wr-stage t-${f.tone}`}>{f.figure}</div><figcaption>{f.text}</figcaption></figure>)}
          </div>
        </section>}
        {insights && insights.length > 0 && <section className="wr-ai" aria-labelledby="wr-ai-title">
          <div className="wr-ai-head">
            <h2 id="wr-ai-title">O que fazer na próxima semana</h2>
            <span className="wr-izi">IZI INTELLIGENCE</span>
          </div>
          <p className="wr-ai-note">Criado com IA a partir dos números deste relatório.</p>
          <ol className="wr-ai-list">
            {insights.map(i => <li key={i.key}>
              <p className="wr-ai-title">{i.title}</p>
              <p className="wr-ai-finding">{i.finding}</p>
              <p className="wr-ai-action"><b>Sugestão:</b> {i.action}</p>
            </li>)}
          </ol>
        </section>}
      </>}
    </div>
  )
}
