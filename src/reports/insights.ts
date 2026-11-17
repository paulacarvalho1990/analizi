// Insights de IA dos relatórios semanais.
// Cada objetivo tem um roteiro fixo de "ângulos" que conversam com as figuras do relatório.
// O código escolhe os ângulos com dados e calcula os números; a IA só escreve as frases.

import { chatJSON, hasLLM, type LLMEnv } from '../insights/llm'
import { CONTACT_LABEL, WEEKDAYS, exitPct, fmt, inTen, n, type Derived, type ReportKind } from './derive'

export type ReportInsight = {
  key: string
  /** Frase curta que resume o achado (até 8 palavras). */
  title: string
  /** O que os números mostram, em linguagem simples (até 22 palavras). */
  finding: string
  /** Uma única ação concreta (até 16 palavras). */
  action: string
}

type Angle = {
  key: string
  /** Pergunta que o ângulo responde — vai para a IA como intenção. */
  intent: string
  /** Fatos já calculados (os únicos números que a IA pode usar) + texto padrão. */
  build: (x: Derived) => { facts: Record<string, string | number>, fallback: Omit<ReportInsight, 'key'> } | null
}

const LIMITS = { title: 8, finding: 22, action: 16 }

/* ---------- ângulos reutilizáveis ---------- */
const A = {
  pageMostContacts: {
    key: 'pagina_que_mais_chama',
    intent: 'Qual página mais gera contato e como levar mais gente até ela.',
    build: (x) => {
      const pg = x.pageContacts[0]
      if (!pg || !pg.c || !x.contacts) return null
      const page = x.pageTitle(pg.path)
      return {
        facts: { pagina: page, contatos_da_pagina: pg.c, contatos_total: x.contacts, origem_principal: x.sourceList[0]?.[0] ?? 'Direto' },
        fallback: { title: `${page} é a página que mais chama`, finding: `Ela gerou ${pg.c} dos ${x.contacts} contatos da semana.`, action: `Divulgue o link de ${page} no ${x.sourceList[0]?.[0] ?? 'seu canal principal'}.` },
      }
    },
  },
  leak: {
    key: 'pagina_que_perde_gente',
    intent: 'Qual página tem muita gente saindo sem fazer nada e o que mudar nela.',
    build: (x) => {
      if (!x.leak) return null
      const page = x.pageTitle(x.leak.path), share = inTen(exitPct(x.leak.exitRate), 100)
      return {
        facts: { pagina: page, saem_sem_fazer_nada: share, visitas_da_pagina: n(x.leak.views) },
        fallback: { title: `Muita gente sai de ${page}`, finding: `${share} pessoas saem dessa página sem clicar em nada.`, action: `Coloque o botão de contato no topo de ${page}.` },
      }
    },
  },
  peakHour: {
    key: 'melhor_horario',
    intent: 'Em que dia e hora as pessoas mais procuram e como aproveitar esse horário.',
    build: (x) => {
      const pk = x.peak
      if (!pk || !(n(pk.contacts) || n(pk.views))) return null
      const when = `${WEEKDAYS[pk.dayOfWeek]}, das ${pk.hourOfDay}h às ${pk.hourOfDay + 1}h`
      return {
        facts: { dia_e_hora: when, contatos_nesse_horario: n(pk.contacts), visitas_nesse_horario: n(pk.views) },
        fallback: { title: `Seu melhor horário é ${WEEKDAYS[pk.dayOfWeek]} ${pk.hourOfDay >= 18 ? 'à noite' : pk.hourOfDay >= 12 ? 'à tarde' : 'de manhã'}`, finding: `O pico foi ${when}.`, action: 'Publique e responda mensagens perto desse horário.' },
      }
    },
  },
  contactChannel: {
    key: 'canal_preferido',
    intent: 'Por qual meio as pessoas preferem chamar e como facilitar esse caminho.',
    build: (x) => {
      const [top] = [...x.contactTypes.entries()].sort((a, b) => b[1] - a[1])
      if (!top || !x.contacts) return null
      const label = CONTACT_LABEL[top[0]]?.[0] ?? top[0]
      return {
        facts: { meio: label, contatos_por_esse_meio: top[1], contatos_total: x.contacts, parcela: inTen(top[1], x.contacts) },
        fallback: { title: `Seus clientes preferem chamar ${label}`, finding: `${inTen(top[1], x.contacts)} contatos chegaram ${label}.`, action: `Deixe o botão ${label} visível em todas as páginas.` },
      }
    },
  },
  sourceThatCalls: {
    key: 'origem_que_mais_chama',
    intent: 'De onde vem quem mais pede contato, comparando com de onde vem mais gente.',
    build: (x) => {
      const c = x.topContactSource, v = x.sourceList[0]
      if (!c || !c[1] || !v) return null
      const same = c[0] === v[0]
      return {
        facts: { origem_que_mais_chama: c[0], contatos_dessa_origem: c[1], origem_que_mais_traz_visitas: v[0], visitas_dessa_origem: v[1] },
        fallback: same
          ? { title: `${c[0]} traz gente e traz contatos`, finding: `${c[0]} trouxe ${fmt(v[1])} visitas e ${c[1]} contatos.`, action: `Mantenha a frequência de publicação no ${c[0]}.` }
          : { title: `${c[0]} chama mais que ${v[0]}`, finding: `${v[0]} trouxe mais visitas, mas ${c[0]} trouxe ${c[1]} contatos.`, action: `Invista mais tempo no ${c[0]} nesta semana.` },
      }
    },
  },
  topSource: {
    key: 'origem_principal',
    intent: 'De onde vem a maior parte das visitas e se o site depende demais de um lugar só.',
    build: (x) => {
      const [s1, s2] = x.sourceList
      if (!s1 || !x.sourceTotal) return null
      const share = inTen(s1[1], x.sourceTotal)
      return {
        facts: { origem: s1[0], visitas: s1[1], parcela: share, segunda_origem: s2?.[0] ?? '', visitas_segunda: s2?.[1] ?? 0 },
        fallback: { title: `${s1[0]} traz a maior parte das visitas`, finding: `${share} visitas vieram de ${s1[0]}.`, action: `Divulgue o site em outro lugar além de ${s1[0]}.` },
      }
    },
  },
  newVsReturning: {
    key: 'novos_e_recorrentes',
    intent: 'Se o site está alcançando gente nova ou dependendo de quem já conhece.',
    build: (x) => {
      const nu = n(x.t.newUsers)
      if (!x.users) return null
      const share = inTen(nu, x.users)
      return {
        facts: { visitantes: x.users, novos: nu, parcela_novos: share },
        fallback: nu >= x.users / 2
          ? { title: 'Muita gente nova conhecendo o site', finding: `${share} visitantes vieram pela primeira vez.`, action: 'Mostre logo no topo como falar com você.' }
          : { title: 'Seu público já conhece você', finding: `Só ${share} visitantes eram novos.`, action: 'Divulgue o site em um lugar novo nesta semana.' },
      }
    },
  },
  topPage: {
    key: 'pagina_mais_vista',
    intent: 'Qual página atrai mais gente e se ela leva as pessoas a pedir contato.',
    build: (x) => {
      const pg = x.topPages[0]
      if (!pg || !n(pg.views)) return null
      const page = x.pageTitle(pg.path)
      const c = x.pageContacts.find(r => r.path === pg.path)?.c ?? 0
      return {
        facts: { pagina: page, visitas: n(pg.views), contatos_da_pagina: c },
        fallback: { title: `${page} é a mais vista`, finding: `Teve ${fmt(n(pg.views))} visitas e gerou ${c} contatos.`, action: `Deixe o botão de contato bem visível em ${page}.` },
      }
    },
  },
  mobile: {
    key: 'celular',
    intent: 'Quanto do público usa celular e o que isso pede do site.',
    build: (x) => {
      if (!x.devTotal) return null
      const share = inTen(x.mobile, x.devTotal)
      return {
        facts: { parcela_celular: share },
        fallback: { title: 'Seu público está no celular', finding: `${share} pessoas acessaram pelo celular.`, action: 'Abra o site no celular e teste o botão de contato.' },
      }
    },
  },
  topCity: {
    key: 'cidade_principal',
    intent: 'Qual cidade concentra o público e como falar com quem é de lá.',
    build: (x) => {
      const c = x.cityList[0]
      if (!c || !x.users) return null
      return {
        facts: { cidade: c[0], visitantes: c[1].users, contatos: c[1].conv, parcela: inTen(c[1].users, x.users) },
        fallback: { title: `${c[0]} concentra seu público`, finding: `${inTen(c[1].users, x.users)} visitantes são de ${c[0]}.`, action: `Cite ${c[0]} nos textos do site e nos posts.` },
      }
    },
  },
  cityThatCalls: {
    key: 'cidade_que_mais_chama',
    intent: 'Qual cidade, proporcionalmente, mais pede contato.',
    build: (x) => {
      const b = x.bestConvCity
      if (!b || !b[1].conv) return null
      return {
        facts: { cidade: b[0], visitantes: b[1].users, contatos: b[1].conv, parcela: inTen(b[1].conv, b[1].users) },
        fallback: { title: `${b[0]} é a cidade que mais chama`, finding: `${b[1].conv} contatos vieram de ${fmt(b[1].users)} visitantes de ${b[0]}.`, action: `Faça um post falando com quem é de ${b[0]}.` },
      }
    },
  },
  outsideRegion: {
    key: 'fora_da_regiao',
    intent: 'Quanto do público é de fora do estado principal e se vale atendê-lo.',
    build: (x) => {
      const r = x.regionList[0]
      if (!r || !x.locTotal) return null
      const out = x.locTotal - r[1]
      if (out <= 0) return null
      return {
        facts: { estado_principal: r[0], visitantes_fora: out, parcela_fora: inTen(out, x.locTotal) },
        fallback: { title: 'Tem gente de fora procurando você', finding: `${fmt(out)} pessoas vieram de fora de ${r[0]}.`, action: 'Deixe claro no site onde e como você atende.' },
      }
    },
  },
} satisfies Record<string, Angle>

/** Roteiro de cada objetivo: ângulos em ordem de prioridade. Usamos os 3 primeiros com dados. */
export const BLUEPRINTS: Record<ReportKind, { goal: string, angles: Angle[] }> = {
  geral: { goal: 'Dar uma visão geral da semana: visitas, contatos e o que mais funcionou.', angles: [A.pageMostContacts, A.topSource, A.leak, A.peakHour, A.mobile] },
  contatos: { goal: 'Aumentar os pedidos de contato pelo site.', angles: [A.leak, A.pageMostContacts, A.sourceThatCalls, A.contactChannel, A.peakHour] },
  visitas: { goal: 'Atrair mais pessoas para o site e entender de onde elas vêm.', angles: [A.topSource, A.newVsReturning, A.topPage, A.sourceThatCalls] },
  regiao: { goal: 'Entender e alcançar melhor o público de cada cidade.', angles: [A.cityThatCalls, A.topCity, A.outsideRegion, A.mobile] },
}

export type BusinessInfo = { name?: string, segment?: string, subsegment?: string, segmentDetail?: string }

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const numbersIn = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) || []).map(v => v.replace(/\./g, '').replace(',', '.'))

function valid(r: Partial<ReportInsight>, allowed: Set<string>) {
  return (['title', 'finding', 'action'] as const).every(f => {
    const v = r[f]
    return typeof v === 'string' && v.trim() && words(v) <= LIMITS[f] && numbersIn(v).every(x => allowed.has(x))
  })
}

/** Gera 2–3 insights para o relatório. Sem chave de IA (ou se ela falhar), devolve o texto padrão. */
export async function buildReportInsights(kind: ReportKind, x: Derived, business: BusinessInfo, llm: LLMEnv = {}): Promise<{ insights: ReportInsight[], model: string }> {
  const picked = BLUEPRINTS[kind].angles.map(a => ({ a, r: a.build(x) })).filter(v => v.r).slice(0, 3) as Array<{ a: Angle, r: NonNullable<ReturnType<Angle['build']>> }>
  const fallback = picked.map(({ a, r }) => ({ key: a.key, ...r.fallback }))
  if (!hasLLM(llm) || picked.length === 0) return { insights: fallback, model: 'IZI INTELLIGENCE (regras)' }

  const negocio = [business.name, business.segment, business.subsegment, business.segmentDetail].filter(Boolean).join(' · ') || 'pequeno negócio'
  const cards = picked.map(({ a, r }) => ({ id: a.key, intencao: a.intent, fatos: r.facts }))
  const prompt = `Você escreve o rodapé de um relatório semanal para o dono de um ${negocio}, que não entende de marketing.
Objetivo do relatório: ${BLUEPRINTS[kind].goal}
Para cada card, escreva um insight que responda à "intencao" usando SOMENTE os "fatos".

FORMATO (por card):
- title: até ${LIMITS.title} palavras, frase simples com o achado.
- finding: até ${LIMITS.finding} palavras, o que os números mostram.
- action: até ${LIMITS.action} palavras, UMA ação concreta para esta semana.

REGRAS:
- Use só números que estão em "fatos". Não calcule nem invente.
- Sem jargão: nada de CTA, conversão, funil, tráfego, engajamento, sessões.
- Fale com a pessoa ("você"). Mantenha ids e ordem.

CARDS:
${JSON.stringify(cards)}

Responda só JSON: {"insights":[{"id":"","title":"","finding":"","action":""}]}`

  try {
    const raw = await chatJSON(llm, [{ role: 'system', content: 'Responda APENAS JSON válido.' }, { role: 'user', content: prompt }])
    if (!raw) return { insights: fallback, model: 'IZI INTELLIGENCE (regras)' }
    const parsed = JSON.parse(raw) as { insights?: Array<Partial<ReportInsight> & { id?: string }> }
    const byId = new Map((parsed.insights || []).map(r => [r.id, r]))
    const insights = picked.map(({ a, r }, i) => {
      const allowed = new Set(Object.values(r.facts).flatMap(v => numbersIn(String(v))))
      const ai = byId.get(a.key)
      return ai && valid(ai, allowed) ? { key: a.key, title: ai.title!.trim(), finding: ai.finding!.trim(), action: ai.action!.trim() } : fallback[i]
    })
    return { insights, model: 'IZI INTELLIGENCE' }
  } catch (err) {
    console.error('Falha ao gerar insights do relatório:', err)
    return { insights: fallback, model: 'IZI INTELLIGENCE (regras)' }
  }
}
