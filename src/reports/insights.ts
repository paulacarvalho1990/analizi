// Insights de IA dos relatórios semanais.
// Cada objetivo tem um roteiro fixo de "ângulos". Para cada ângulo o código calcula:
//  - a métrica da semana e a da semana anterior (comparação),
//  - os fatos que explicam o número (descritiva),
//  - ações com o benefício de cada uma,
// e a IA só escreve as frases, usando apenas esses números.

import { chatJSON, hasLLM, type LLMEnv } from '../insights/llm'
import { CONTACT_LABEL, WEEKDAYS, exitPct, fmt, inTen, n, type Derived, type ReportKind } from './derive'
import { businessProfile, personalize } from './business-profile'

export type Trend = 'up' | 'down' | 'flat' | 'new'

export type Step = { step: string, helps: string }

export type ReportInsight = {
  key: string
  /** Frase curta que resume o achado (até 10 palavras). */
  title: string
  /** Comparação com a semana anterior. */
  comparison?: string
  /** O que aconteceu e por que importa. */
  descriptive?: string
  /** 2–3 ações concretas, cada uma com no que ela ajuda (relatórios antigos têm string). */
  actions?: Array<Step | string>
  /** Formato antigo (relatórios já salvos). */
  forecast?: string
  /** Métrica principal do card (para o selo visual). */
  metric?: { label: string, current: number, previous: number | null, trend: Trend, change: number | null, lowerIsBetter?: boolean }
  /** Formato antigo (relatórios já salvos). */
  finding?: string
  action?: string
}

type Metric = { label: string, cur: number, prev: number | null }
type Built = {
  metric: Metric
  facts: Record<string, string | number>
  fallback: { title: string, descriptive: string, actions: Step[] }
}
type Angle = { key: string, intent: string, build: (x: Derived, px: Derived | null) => Built | null }

const LIMITS = { title: 10, comparison: 32, descriptive: 45, action: 22, helps: 16 }

/* ---------- comparação e previsão (sempre no código) ---------- */
function trendOf(cur: number, prev: number | null): Trend {
  if (prev === null) return 'flat'
  if (!prev) return cur ? 'new' : 'flat'
  const d = (cur - prev) / prev
  return d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat'
}
const pct = (cur: number, prev: number) => Math.round(Math.abs((cur - prev) / prev) * 100)

function compareText(m: Metric) {
  const t = trendOf(m.cur, m.prev)
  if (m.prev === null) return `Sem dados da semana anterior para comparar. Nesta semana foram ${fmt(m.cur)} ${m.label}.`
  if (t === 'new') return `Na semana anterior não houve ${m.label}; nesta semana foram ${fmt(m.cur)}.`
  if (t === 'flat') return `Ficou estável: ${fmt(m.cur)} ${m.label}, contra ${fmt(m.prev)} na semana anterior.`
  return `${t === 'up' ? 'Subiu' : 'Caiu'} de ${fmt(m.prev)} para ${fmt(m.cur)} ${m.label}, ${t === 'up' ? 'alta' : 'queda'} de ${pct(m.cur, m.prev)}% sobre a semana anterior.`
}
function metricFacts(m: Metric): Record<string, string | number> {
  const f: Record<string, string | number> = { metrica: m.label, valor_semana: m.cur, tendencia: trendOf(m.cur, m.prev) }
  if (m.prev !== null) { f.valor_semana_anterior = m.prev; if (m.prev) f.variacao_pct = pct(m.cur, m.prev) }
  return f
}

/* ---------- ângulos ---------- */
const pageC = (x: Derived | null, path: string) => x ? (x.pageContacts.find(r => r.path === path)?.c ?? 0) : null
const pageV = (x: Derived | null, path: string) => x ? n(x.topPages.find(r => r.path === path)?.views) : null
const srcV = (x: Derived | null, name: string) => x ? (x.sourceList.find(s => s[0] === name)?.[1] ?? 0) : null
const srcC = (x: Derived | null, name: string) => x ? (x.contactSourceList.find(s => s[0] === name)?.[1] ?? 0) : null
const cityOf = (x: Derived | null, name: string) => x ? (x.cityList.find(c => c[0] === name)?.[1] ?? { users: 0, conv: 0 }) : null

const A = {
  panoramaContacts: {
    key: 'panorama_contatos',
    intent: 'Como foram os pedidos de contato da semana, comparados com a anterior, e o que esperar.',
    build: (x, px) => {
      if (!x.contacts && !x.users) return null
      const rate = x.users ? Math.round((x.contacts / x.users) * 1000) / 10 : 0
      const prate = px?.users ? Math.round((px.contacts / px.users) * 1000) / 10 : null
      const m = { label: 'contatos', cur: x.contacts, prev: px ? px.contacts : x.prevContacts }
      const best = x.bestContacts && n(x.bestContacts.contacts) ? x.bestContacts : null
      return {
        metric: m,
        facts: { ...metricFacts(m), visitantes: x.users, contatos_a_cada_100_visitantes: rate, ...(prate !== null ? { contatos_a_cada_100_semana_anterior: prate } : {}), ...(best ? { melhor_dia: WEEKDAYS[new Date(`${best.date}T12:00:00Z`).getUTCDay()], contatos_melhor_dia: n(best.contacts) } : {}) },
        fallback: {
          title: x.contacts ? `${fmt(x.contacts)} pedidos de contato nesta semana` : 'Nenhum pedido de contato nesta semana',
          descriptive: `De ${fmt(x.users)} visitantes, ${fmt(x.contacts)} chamaram você, cerca de ${String(rate).replace('.', ',')} a cada 100.${best ? ` O dia mais forte foi ${WEEKDAYS[new Date(`${best.date}T12:00:00Z`).getUTCDay()]}.` : ''}`,
          actions: [{ step: 'Responda todo contato no mesmo dia; quem espera muito procura outro.', helps: 'Ajuda a não perder quem já quis contratar você.' }, { step: 'Anote de onde veio cada cliente que fechou para saber o que funciona.', helps: 'Ajuda a saber onde vale a pena investir seu tempo.' }],
        },
      }
    },
  },
  panoramaVisits: {
    key: 'panorama_visitas',
    intent: 'Quantas pessoas visitaram o site, comparado com a semana anterior, e o que esperar.',
    build: (x, px) => {
      if (!x.users) return null
      const nu = n(x.t.newUsers)
      const m = { label: 'visitantes', cur: x.users, prev: px ? px.users : x.prevUsers }
      return {
        metric: m,
        facts: { ...metricFacts(m), visualizacoes: x.pv, novos: nu, ...(px ? { novos_semana_anterior: n(px.t.newUsers) } : {}) },
        fallback: {
          title: `${fmt(x.users)} pessoas visitaram o site`,
          descriptive: `Foram ${fmt(x.pv)} páginas vistas e ${fmt(nu)} visitantes novos. Mais gente nova significa mais chance de novos clientes.`,
          actions: [{ step: 'Publique pelo menos dois conteúdos com o link do site nesta semana.', helps: 'Ajuda a trazer mais gente para o site.' }, { step: 'Peça a clientes satisfeitos que indiquem o site para conhecidos.', helps: 'Ajuda a atrair gente que já chega confiando em você.' }],
        },
      }
    },
  },
  pageMostContacts: {
    key: 'pagina_que_mais_chama',
    intent: 'Qual página mais gera contato, como ela evoluiu e como levar mais gente até ela.',
    build: (x, px) => {
      const pg = x.pageContacts[0]
      if (!pg || !pg.c || !x.contacts) return null
      const page = x.pageTitle(pg.path)
      const m = { label: `contatos vindos de ${page}`, cur: pg.c, prev: pageC(px, pg.path) }
      return {
        metric: m,
        facts: { ...metricFacts(m), pagina: page, contatos_total: x.contacts, visitas_da_pagina: pg.s, origem_principal: x.sourceList[0]?.[0] ?? 'Direto' },
        fallback: {
          title: `${page} é a página que mais chama`,
          descriptive: `Ela gerou ${pg.c} dos ${x.contacts} contatos da semana. Quem chega nela já está perto de decidir, então cada visita a mais vale muito.`,
          actions: [{ step: `Coloque o link de ${page} nos próximos posts e na bio do ${x.sourceList[0]?.[0] ?? 'seu canal principal'}.`, helps: 'Ajuda a levar mais gente direto para a página que mais gera contato.' }, { step: `Repita em outras páginas o que ${page} tem de diferente: fotos, preços ou depoimentos.`, helps: 'Ajuda as outras páginas a gerarem contato também.' }],
        },
      }
    },
  },
  leak: {
    key: 'pagina_que_perde_gente',
    intent: 'Qual página tem muita gente saindo sem fazer nada, se piorou e o que mudar nela.',
    build: (x, px) => {
      if (!x.leak) return null
      const page = x.pageTitle(x.leak.path), share = Math.round(exitPct(x.leak.exitRate))
      const prevPg = px?.topPages.find(p => p.path === x.leak!.path)
      const m = { label: `% de saídas em ${page}`, cur: share, prev: px ? (prevPg ? Math.round(exitPct(prevPg.exitRate)) : null) : null }
      return {
        metric: m,
        facts: { ...metricFacts(m), pagina: page, saem_sem_fazer_nada: inTen(share, 100), visitas_da_pagina: n(x.leak.views) },
        fallback: {
          title: `Muita gente sai de ${page}`,
          descriptive: `${inTen(share, 100)} pessoas saem dessa página sem clicar em nada. Elas chegaram até você, mas não encontraram rápido o que procuravam.`,
          actions: [{ step: `Coloque o botão de contato logo no topo de ${page}.`, helps: 'Ajuda quem chega a falar com você antes de desistir.' }, { step: 'Diga em uma frase, no início da página, o que a pessoa ganha ao chamar você.', helps: 'Ajuda a pessoa a entender rápido por que chamar você.' }, { step: 'Confira se a página abre rápido no celular.', helps: 'Ajuda a não perder quem desiste de esperar a página carregar.' }],
        },
      }
    },
  },
  peakHour: {
    key: 'melhor_horario',
    intent: 'Em que dia e hora as pessoas mais procuram, se isso se repetiu e como aproveitar.',
    build: (x, px) => {
      const pk = x.peak
      if (!pk || !(n(pk.contacts) || n(pk.views))) return null
      const when = `${WEEKDAYS[pk.dayOfWeek]}, das ${pk.hourOfDay}h às ${pk.hourOfDay + 1}h`
      const useC = n(pk.contacts) > 0
      const slot = px?.peakHours.find(h => h.dayOfWeek === pk.dayOfWeek && h.hourOfDay === pk.hourOfDay)
      const m = { label: useC ? 'contatos nesse horário' : 'visitas nesse horário', cur: useC ? n(pk.contacts) : n(pk.views), prev: px ? (useC ? n(slot?.contacts) : n(slot?.views)) : null }
      const prevPeak = px?.peak
      return {
        metric: m,
        facts: { ...metricFacts(m), dia_e_hora: when, ...(prevPeak ? { pico_semana_anterior: `${WEEKDAYS[prevPeak.dayOfWeek]}, ${prevPeak.hourOfDay}h` } : {}) },
        fallback: {
          title: `Seu melhor horário é ${WEEKDAYS[pk.dayOfWeek]} ${pk.hourOfDay >= 18 ? 'à noite' : pk.hourOfDay >= 12 ? 'à tarde' : 'de manhã'}`,
          descriptive: `O pico foi ${when}. É quando seu público está com tempo e disposição para procurar você.`,
          actions: [{ step: 'Publique perto desse horário.', helps: 'Ajuda seus posts a aparecerem quando o público está procurando.' }, { step: 'Deixe alguém pronto para responder as mensagens rápido nessa janela.', helps: 'Ajuda a fechar mais, porque quem é respondido rápido não procura outro.' }],
        },
      }
    },
  },
  contactChannel: {
    key: 'canal_preferido',
    intent: 'Por qual meio as pessoas preferem chamar, como isso mudou e como facilitar esse caminho.',
    build: (x, px) => {
      const [top] = [...x.contactTypes.entries()].sort((a, b) => b[1] - a[1])
      if (!top || !x.contacts) return null
      const label = CONTACT_LABEL[top[0]]?.[0] ?? top[0]
      const m = { label: `contatos ${label}`, cur: top[1], prev: px ? (px.contactTypes.get(top[0]) ?? 0) : null }
      return {
        metric: m,
        facts: { ...metricFacts(m), meio: label, contatos_total: x.contacts, parcela: inTen(top[1], x.contacts) },
        fallback: {
          title: `Seus clientes preferem chamar ${label}`,
          descriptive: `${inTen(top[1], x.contacts)} contatos chegaram ${label}. É o caminho em que seus clientes se sentem mais à vontade.`,
          actions: [{ step: `Deixe o botão ${label} visível em todas as páginas, inclusive no celular.`, helps: 'Ajuda a pessoa a chamar pelo caminho que ela já prefere.' }, { step: 'Prepare respostas prontas para as perguntas mais comuns e responda rápido.', helps: 'Ajuda a responder mais rápido e não perder interessados.' }],
        },
      }
    },
  },
  sourceThatCalls: {
    key: 'origem_que_mais_chama',
    intent: 'De onde vem quem mais pede contato, como evoluiu, comparando com de onde vem mais gente.',
    build: (x, px) => {
      const c = x.topContactSource, v = x.sourceList[0]
      if (!c || !c[1] || !v) return null
      const same = c[0] === v[0]
      const m = { label: `contatos vindos de ${c[0]}`, cur: c[1], prev: srcC(px, c[0]) }
      return {
        metric: m,
        facts: { ...metricFacts(m), origem_que_mais_chama: c[0], origem_que_mais_traz_visitas: v[0], visitas_dessa_origem: v[1] },
        fallback: same
          ? { title: `${c[0]} traz gente e traz contatos`, descriptive: `${c[0]} trouxe ${fmt(v[1])} visitas e ${c[1]} contatos. Ele atrai gente e também traz quem quer contratar.`, actions: [{ step: `Mantenha a frequência no ${c[0]}.`, helps: 'Ajuda a manter o canal que já traz contatos funcionando.' }, { step: `Teste no ${c[0]} um conteúdo respondendo a uma dúvida comum dos clientes.`, helps: 'Ajuda a atrair gente com a mesma dúvida, que está perto de contratar.' }] }
          : { title: `${c[0]} chama mais que ${v[0]}`, descriptive: `${v[0]} trouxe mais visitas, mas ${c[0]} trouxe ${c[1]} contatos. Quem vem de ${c[0]} chega mais decidido.`, actions: [{ step: `Dedique mais tempo ao ${c[0]} nesta semana.`, helps: 'Ajuda a investir esforço onde vêm as pessoas mais decididas.' }, { step: `No ${v[0]}, mande as pessoas para uma página com botão de contato.`, helps: 'Ajuda a transformar visitas desse canal em contatos.' }] },
      }
    },
  },
  topSource: {
    key: 'origem_principal',
    intent: 'De onde vem a maior parte das visitas, como mudou e se o site depende demais de um lugar só.',
    build: (x, px) => {
      const [s1, s2] = x.sourceList
      if (!s1 || !x.sourceTotal) return null
      const share = inTen(s1[1], x.sourceTotal)
      const m = { label: `visitas vindas de ${s1[0]}`, cur: s1[1], prev: srcV(px, s1[0]) }
      return {
        metric: m,
        facts: { ...metricFacts(m), origem: s1[0], parcela: share, segunda_origem: s2?.[0] ?? '', visitas_segunda: s2?.[1] ?? 0, ...(s2 && px ? { visitas_segunda_semana_anterior: srcV(px, s2[0]) ?? 0 } : {}) },
        fallback: {
          title: `${s1[0]} traz a maior parte das visitas`,
          descriptive: `${share} visitas vieram de ${s1[0]}. Depender muito de um lugar só deixa o site vulnerável se ele mudar ou cair.`,
          actions: [{ step: 'Escolha um segundo lugar para divulgar o site nesta semana, como Google Meu Negócio.', helps: 'Ajuda a não depender de um único lugar para receber visitas.' }, { step: `Continue no ${s1[0]}, sempre com o link do site.`, helps: 'Ajuda a manter a principal fonte de visitas.' }],
        },
      }
    },
  },
  newVsReturning: {
    key: 'novos_e_recorrentes',
    intent: 'Se o site está alcançando gente nova ou dependendo de quem já conhece, e a tendência.',
    build: (x, px) => {
      const nu = n(x.t.newUsers)
      if (!x.users) return null
      const share = inTen(nu, x.users)
      const m = { label: 'visitantes novos', cur: nu, prev: px ? n(px.t.newUsers) : null }
      return {
        metric: m,
        facts: { ...metricFacts(m), visitantes: x.users, parcela_novos: share },
        fallback: nu >= x.users / 2
          ? { title: 'Muita gente nova conhecendo o site', descriptive: `${share} visitantes vieram pela primeira vez. Quem não conhece você precisa entender rápido o que você faz.`, actions: [{ step: 'Deixe no topo da página inicial uma frase clara sobre o seu serviço.', helps: 'Ajuda quem não conhece você a entender rápido o que você faz.' }, { step: 'Mostre depoimentos de clientes logo na primeira tela.', helps: 'Ajuda a ganhar a confiança de quem chega pela primeira vez.' }] }
          : { title: 'Seu público já conhece você', descriptive: `Só ${share} visitantes eram novos. É bom ter gente fiel, mas sem gente nova o número de clientes não cresce.`, actions: [{ step: 'Divulgue o site num lugar onde você ainda não aparece.', helps: 'Ajuda a alcançar gente nova, que pode virar cliente.' }, { step: 'Ofereça um benefício para quem indicar um amigo.', helps: 'Ajuda seus clientes atuais a trazerem gente nova.' }] },
      }
    },
  },
  topPage: {
    key: 'pagina_mais_vista',
    intent: 'Qual página atrai mais gente, como evoluiu e se ela leva as pessoas a pedir contato.',
    build: (x, px) => {
      const pg = x.topPages[0]
      if (!pg || !n(pg.views)) return null
      const page = x.pageTitle(pg.path)
      const c = pageC(x, pg.path) ?? 0
      const m = { label: `visitas em ${page}`, cur: n(pg.views), prev: pageV(px, pg.path) }
      return {
        metric: m,
        facts: { ...metricFacts(m), pagina: page, contatos_da_pagina: c },
        fallback: {
          title: `${page} é a mais vista`,
          descriptive: `Teve ${fmt(n(pg.views))} visitas e gerou ${c} contatos. É a vitrine do site, então qualquer melhoria nela atinge muita gente.`,
          actions: [{ step: `Deixe o botão de contato visível em ${page} sem precisar rolar a tela.`, helps: 'Ajuda a página mais vista a gerar mais contatos.' }, { step: 'Acrescente uma frase dizendo por que escolher você.', helps: 'Ajuda a pessoa a decidir por você e não pelo concorrente.' }],
        },
      }
    },
  },
  mobile: {
    key: 'celular',
    intent: 'Quanto do público usa celular, como mudou e o que isso pede do site.',
    build: (x, px) => {
      if (!x.devTotal) return null
      const share = inTen(x.mobile, x.devTotal)
      const m = { label: 'visitantes no celular', cur: x.mobile, prev: px ? px.mobile : null }
      return {
        metric: m,
        facts: { ...metricFacts(m), parcela_celular: share },
        fallback: {
          title: 'Seu público está no celular',
          descriptive: `${share} pessoas acessaram pelo celular. Se algo não funciona bem na tela pequena, você perde essas pessoas sem perceber.`,
          actions: [{ step: 'Abra o site no seu celular como se fosse um cliente e teste o botão de contato.', helps: 'Ajuda a achar problemas que fazem você perder contatos sem saber.' }, { step: 'Encurte textos longos do topo das páginas.', helps: 'Ajuda a pessoa a achar o que procura sem cansar na tela pequena.' }],
        },
      }
    },
  },
  topCity: {
    key: 'cidade_principal',
    intent: 'Qual cidade concentra o público, como evoluiu e como falar com quem é de lá.',
    build: (x, px) => {
      const c = x.cityList[0]
      if (!c || !x.users) return null
      const m = { label: `visitantes de ${c[0]}`, cur: c[1].users, prev: cityOf(px, c[0])?.users ?? null }
      return {
        metric: m,
        facts: { ...metricFacts(m), cidade: c[0], contatos: c[1].conv, parcela: inTen(c[1].users, x.users) },
        fallback: {
          title: `${c[0]} concentra seu público`,
          descriptive: `${inTen(c[1].users, x.users)} visitantes são de ${c[0]}. Falar diretamente com quem é de lá aumenta a confiança.`,
          actions: [{ step: `Cite ${c[0]} nos textos do site e nos posts.`, helps: 'Ajuda quem é de lá a se identificar e confiar em você.' }, { step: 'Mostre se você atende na região ou em domicílio.', helps: 'Ajuda a evitar que a pessoa desista por achar que você não atende onde ela está.' }],
        },
      }
    },
  },
  cityThatCalls: {
    key: 'cidade_que_mais_chama',
    intent: 'Qual cidade, proporcionalmente, mais pede contato e como isso evoluiu.',
    build: (x, px) => {
      const b = x.bestConvCity
      if (!b || !b[1].conv) return null
      const m = { label: `contatos de ${b[0]}`, cur: b[1].conv, prev: cityOf(px, b[0])?.conv ?? null }
      return {
        metric: m,
        facts: { ...metricFacts(m), cidade: b[0], visitantes: b[1].users, parcela: inTen(b[1].conv, b[1].users) },
        fallback: {
          title: `${b[0]} é a cidade que mais chama`,
          descriptive: `${b[1].conv} contatos vieram de ${fmt(b[1].users)} visitantes de ${b[0]}. Proporcionalmente, é onde mais gente decide chamar você.`,
          actions: [{ step: `Faça um post falando direto com quem é de ${b[0]}.`, helps: 'Ajuda a atrair mais gente da cidade que mais chama você.' }, { step: 'Mostre clientes ou trabalhos feitos lá.', helps: 'Ajuda a passar confiança para quem é da mesma cidade.' }],
        },
      }
    },
  },
  outsideRegion: {
    key: 'fora_da_regiao',
    intent: 'Quanto do público é de fora do estado principal, como mudou e se vale atendê-lo.',
    build: (x, px) => {
      const r = x.regionList[0]
      if (!r || !x.locTotal) return null
      const out = x.locTotal - r[1]
      if (out <= 0) return null
      const pr = px?.regionList.find(v => v[0] === r[0])
      const m = { label: `visitantes de fora de ${r[0]}`, cur: out, prev: px ? px.locTotal - (pr?.[1] ?? 0) : null }
      return {
        metric: m,
        facts: { ...metricFacts(m), estado_principal: r[0], parcela_fora: inTen(out, x.locTotal) },
        fallback: {
          title: 'Tem gente de fora procurando você',
          descriptive: `${fmt(out)} pessoas vieram de fora de ${r[0]}. Elas podem virar clientes se souberem que você atende longe.`,
          actions: [{ step: 'Deixe claro no site onde você atende.', helps: 'Ajuda a pessoa de fora a saber se pode contratar você.' }, { step: 'Informe se faz atendimento online ou envio para outras cidades.', helps: 'Ajuda a transformar visitas de fora em clientes.' }],
        },
      }
    },
  },
} satisfies Record<string, Angle>

/** Roteiro de cada objetivo: um panorama + até 3 ângulos com dados, em ordem de prioridade. */
export const BLUEPRINTS: Record<ReportKind, { goal: string, angles: Angle[] }> = {
  geral: { goal: 'Dar uma visão geral da semana: visitas, contatos e o que mais funcionou.', angles: [A.panoramaContacts, A.pageMostContacts, A.topSource, A.leak, A.peakHour, A.mobile] },
  contatos: { goal: 'Aumentar os pedidos de contato pelo site.', angles: [A.panoramaContacts, A.leak, A.pageMostContacts, A.sourceThatCalls, A.contactChannel, A.peakHour] },
  visitas: { goal: 'Atrair mais pessoas para o site e entender de onde elas vêm.', angles: [A.panoramaVisits, A.topSource, A.newVsReturning, A.topPage, A.sourceThatCalls] },
  regiao: { goal: 'Entender e alcançar melhor o público de cada cidade.', angles: [A.panoramaVisits, A.cityThatCalls, A.topCity, A.outsideRegion, A.mobile] },
}

export type BusinessInfo = { name?: string, segment?: string, subsegment?: string, segmentDetail?: string }

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const numbersIn = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) || []).map(v => v.replace(/\./g, '').replace(',', '.'))
const okText = (v: unknown, max: number, allowed: Set<string>) => typeof v === 'string' && !!v.trim() && words(v) <= max && numbersIn(v).every(x => allowed.has(x))

type AIOut = { id?: string, title?: string, comparison?: string, descriptive?: string, actions?: unknown }
function valid(r: AIOut, allowed: Set<string>) {
  return okText(r.title, LIMITS.title, allowed)
    && okText(r.descriptive, LIMITS.descriptive, allowed)
    && Array.isArray(r.actions) && r.actions.length >= 2 && r.actions.length <= 3 && r.actions.every(a => !!a && typeof a === 'object' && okText((a as Step).step, LIMITS.action, allowed) && okText((a as Step).helps, LIMITS.helps, allowed))
}

/** Gera 3 insights (panorama + 2 ângulos). `px` é a semana anterior derivada (quando disponível). */
export async function buildReportInsights(kind: ReportKind, x: Derived, business: BusinessInfo, llm: LLMEnv = {}, px: Derived | null = null): Promise<{ insights: ReportInsight[], model: string }> {
  const picked = BLUEPRINTS[kind].angles.map(a => ({ a, r: a.build(x, px) })).filter((v): v is { a: Angle, r: Built } => !!v.r).slice(0, 3)
  const metricOf = (m: Metric, key: string) => ({ label: m.label, current: m.cur, previous: m.prev, trend: trendOf(m.cur, m.prev), change: m.prev ? pct(m.cur, m.prev) : null, ...(key === 'pagina_que_perde_gente' ? { lowerIsBetter: true } : {}) })
  const prof = businessProfile(business)
  const fallback: ReportInsight[] = picked.map(({ a, r }, i) => ({
    key: a.key, title: personalize(r.fallback.title, prof), comparison: compareText(r.metric), descriptive: personalize(r.fallback.descriptive, prof),
    metric: metricOf(r.metric, a.key),
    // O primeiro card (panorama) ganha a ação típica do setor.
    actions: (i === 0 ? [{ step: prof.tip, helps: prof.tipHelps }, ...r.fallback.actions].slice(0, 3) : r.fallback.actions).map(a => ({ step: personalize(a.step, prof), helps: personalize(a.helps, prof) })),
  }))
  if (!hasLLM(llm) || picked.length === 0) return { insights: fallback, model: 'IZI INTELLIGENCE (regras)' }

  const negocio = [business.name, business.segment, business.subsegment, business.segmentDetail].filter(Boolean).join(' · ') || 'pequeno negócio'
  const contexto = {
    visitantes_semana: x.users, contatos_semana: x.contacts,
    visitantes_semana_anterior: px ? px.users : x.prevUsers ?? 'sem dados',
    contatos_semana_anterior: px ? px.contacts : x.prevContacts ?? 'sem dados',
  }
  const cards = picked.map(({ a, r }, i) => ({ id: a.key, intencao: a.intent, fatos: r.facts, exemplo: { title: fallback[i].title, descriptive: fallback[i].descriptive, actions: fallback[i].actions } }))
  const prompt = `Você é analista e escreve a seção de análise de um relatório semanal para o dono de um ${negocio}, que não entende de marketing.
Objetivo do relatório: ${BLUEPRINTS[kind].goal}
Contexto da semana: ${JSON.stringify(contexto)}
Perfil do negócio: chame quem compra de "${prof.person[1]}"; o contato costuma virar ${prof.request}; conteúdos que funcionam no setor: ${prof.content.join('; ')}.${prof.care ? `\nCuidado: ${prof.care}` : ''}
Para cada card, responda à "intencao" usando os "fatos". O "exemplo" mostra o tom e o tamanho: melhore-o, tornando-o específico para esse tipo de negócio (cite situações, serviços ou clientes típicos dele).

FORMATO (por card):
- title: até ${LIMITS.title} palavras, o achado principal.
- descriptive: até ${LIMITS.descriptive} palavras, 2 frases: o que os fatos mostram (pode citar a mudança em relação à semana anterior) e o provável motivo/por que importa para o negócio. Não invente causas sem base.
- actions: lista de 2 ou 3 ações concretas para esta semana. Cada ação é {"step","helps"}: step (até ${LIMITS.action} palavras) diz o quê, onde e como, com exemplos reais desse tipo de negócio (serviços, situações e ${prof.person[1]} típicos); helps (até ${LIMITS.helps} palavras) começa com "Ajuda a" e diz no que essa ação ajuda o negócio. A primeira é a mais importante. Nada de ação genérica que serviria para qualquer negócio.

REGRAS:
- Use só números presentes em "fatos" ou no contexto. Não calcule nem invente números.
- Não prometa resultados.
- Sem jargão: nada de CTA, conversão, funil, tráfego, engajamento, sessões, KPI.
- Fale com a pessoa ("você"), tom próximo e direto. Mantenha ids e ordem.

CARDS:
${JSON.stringify(cards)}

Responda só JSON: {"insights":[{"id":"","title":"","descriptive":"","actions":[{"step":"","helps":""}]}]}`

  try {
    const raw = await chatJSON(llm, [{ role: 'system', content: 'Responda APENAS JSON válido.' }, { role: 'user', content: prompt }])
    if (!raw) return { insights: fallback, model: 'IZI INTELLIGENCE (regras)' }
    const parsed = JSON.parse(raw) as { insights?: AIOut[] }
    const byId = new Map((parsed.insights || []).map(r => [r.id, r]))
    const insights = picked.map(({ a, r }, i) => {
      const allowed = new Set([...Object.values(r.facts), ...Object.values(contexto)].flatMap(v => numbersIn(String(v))))
      const ai = byId.get(a.key)
      if (!ai || !valid(ai, allowed)) return fallback[i]
      return { ...fallback[i], title: ai.title!.trim(), descriptive: ai.descriptive!.trim(), actions: (ai.actions as Step[]).map(a => ({ step: a.step.trim(), helps: a.helps.trim() })) }
    })
    return { insights, model: 'IZI INTELLIGENCE' }
  } catch (err) {
    console.error('Falha ao gerar insights do relatório:', err)
    return { insights: fallback, model: 'IZI INTELLIGENCE (regras)' }
  }
}
