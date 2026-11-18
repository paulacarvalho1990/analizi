// Perfil do negócio para personalizar os insights: como chamar o cliente, o que é um "pedido",
// exemplos de conteúdo e cuidados do setor. Vem do segmento/subsegmento escolhido no cadastro.

export type BusinessProfile = {
  /** Como o negócio chama quem compra (singular/plural). */
  person: [string, string]
  /** O que o contato costuma virar (agendamento, orçamento, compra…). */
  request: string
  /** Ideias de conteúdo que funcionam no setor. */
  content: string[]
  /** Ação típica do setor para usar no texto padrão. */
  tip: string
  /** Cuidados de linguagem do setor (vai para a IA). */
  care?: string
}

const HEALTH_CARE = 'Saúde: não prometa cura nem resultado, não use antes/depois e respeite as regras do conselho profissional.'

const BY_SUBSEGMENT: Array<[RegExp, Partial<BusinessProfile>]> = [
  [/odonto/i, { person: ['paciente', 'pacientes'], request: 'agendamento de avaliação', content: ['dúvidas sobre clareamento e implante', 'como é a primeira consulta'], tip: 'Ofereça horários de avaliação no fim do dia e responda pelo WhatsApp com os horários livres.' }],
  [/psico/i, { person: ['paciente', 'pacientes'], request: 'agendamento da primeira sessão', content: ['como funciona a terapia online', 'sinais de que é hora de buscar ajuda'], tip: 'Explique no site como funciona a primeira sessão e se atende online.' }],
  [/fisio/i, { person: ['paciente', 'pacientes'], request: 'agendamento de avaliação', content: ['exercícios simples para dor nas costas', 'quando procurar fisioterapia'], tip: 'Mostre os convênios aceitos e os horários de atendimento logo no topo do site.' }],
  [/nutri/i, { person: ['paciente', 'pacientes'], request: 'agendamento de consulta', content: ['receitas rápidas e saudáveis', 'como é o acompanhamento'], tip: 'Deixe claro no site como funciona o acompanhamento e se a consulta pode ser online.' }],
  [/dermato/i, { person: ['paciente', 'pacientes'], request: 'agendamento de consulta', content: ['cuidados com a pele no calor', 'quando procurar um dermatologista'], tip: 'Informe convênios e o tempo de espera para consulta na página inicial.' }],
  [/cl[ií]nica|exame|diagn/i, { person: ['paciente', 'pacientes'], request: 'agendamento', content: ['preparo para exames', 'convênios aceitos'], tip: 'Coloque a lista de convênios e o botão de agendar visíveis no celular.' }],
  [/advoca/i, { person: ['cliente', 'clientes'], request: 'consulta inicial', content: ['direitos trabalhistas mais pedidos', 'documentos para levar na primeira conversa'], tip: 'Mostre as áreas em que você atua e como agendar a primeira conversa.', care: 'Advocacia: sem promessa de resultado nem captação agressiva, conforme o código de ética da OAB.' }],
  [/contab/i, { person: ['cliente', 'clientes'], request: 'pedido de orçamento', content: ['prazos de impostos do mês', 'como abrir um MEI'], tip: 'Lembre no site e nas redes os prazos de impostos do mês, com o botão para falar com você.' }],
  [/arquitet|engenh|constru|reforma/i, { person: ['cliente', 'clientes'], request: 'pedido de orçamento', content: ['fotos de obras entregues', 'quanto custa uma reforma'], tip: 'Mostre fotos de projetos entregues perto do botão de orçamento.' }],
  [/fotograf|evento/i, { person: ['cliente', 'clientes'], request: 'pedido de orçamento', content: ['bastidores de um evento', 'galeria de trabalhos recentes'], tip: 'Mostre sua agenda de datas livres e um portfólio curto antes do botão de orçamento.' }],
  [/educa/i, { person: ['aluno', 'alunos'], request: 'pedido de matrícula', content: ['depoimentos de alunos', 'como é uma aula'], tip: 'Deixe datas de início das turmas e valores claros, com o botão de matrícula.' }],
  [/beleza|est[ée]tica|cosm/i, { person: ['cliente', 'clientes'], request: 'agendamento', content: ['resultados de procedimentos', 'promoções da semana'], tip: 'Publique os horários livres da semana nas redes, com o link do site para agendar.' }],
  [/autom|autope/i, { person: ['cliente', 'clientes'], request: 'pedido de orçamento', content: ['revisão antes de viajar', 'sinais de problema no carro'], tip: 'Coloque o botão de orçamento pelo WhatsApp com pedido de foto ou modelo do carro.' }],
  [/moda|acess[óo]rio/i, { person: ['cliente', 'clientes'], request: 'compra', content: ['novidades da semana', 'looks montados'], tip: 'Destaque as novidades da semana na página inicial e nas redes.' }],
  [/aliment|bebida/i, { person: ['cliente', 'clientes'], request: 'pedido', content: ['cardápio do dia', 'combos e promoções'], tip: 'Deixe o cardápio e a área de entrega visíveis, com o botão para pedir.' }],
  [/pet/i, { person: ['tutor', 'tutores'], request: 'pedido ou agendamento', content: ['cuidados com o pet no calor', 'novidades da loja'], tip: 'Mostre os serviços de banho e tosa com horários e o botão para agendar.' }],
  [/tecnolog|consult/i, { person: ['cliente', 'clientes'], request: 'pedido de proposta', content: ['casos de clientes atendidos', 'problemas comuns que você resolve'], tip: 'Mostre um caso de cliente resolvido e convide para uma conversa rápida.' }],
]

const BY_SEGMENT: Record<string, BusinessProfile> = {
  health: { person: ['paciente', 'pacientes'], request: 'agendamento', content: ['dúvidas comuns dos pacientes', 'como funciona o atendimento'], tip: 'Mostre horários, convênios e o botão de agendar logo no topo do site.', care: HEALTH_CARE },
  products: { person: ['cliente', 'clientes'], request: 'compra', content: ['novidades e mais vendidos', 'promoções da semana'], tip: 'Destaque os produtos mais vendidos na página inicial, com preço e botão de comprar.' },
  services: { person: ['cliente', 'clientes'], request: 'pedido de orçamento', content: ['trabalhos recentes', 'dúvidas comuns dos clientes'], tip: 'Mostre trabalhos recentes e o botão de orçamento lado a lado.' },
}

const segKey = (s?: string) => {
  const k = (s || '').toLowerCase()
  if (/sa[uú]de|health/.test(k)) return 'health'
  if (/produto|product/.test(k)) return 'products'
  return 'services'
}

export function businessProfile(b: { segment?: string, subsegment?: string, segmentDetail?: string }): BusinessProfile {
  const base = BY_SEGMENT[segKey(b.segment)]
  const text = `${b.subsegment || ''} ${b.segmentDetail || ''}`
  const hit = BY_SUBSEGMENT.find(([re]) => re.test(text))?.[1]
  return { ...base, ...hit, care: hit?.care ?? base.care }
}

/** Troca "cliente(s)" pelo termo do negócio (ex.: paciente) no texto padrão. */
export function personalize(s: string, p: BusinessProfile) {
  return s.replace(/\bclientes\b/g, p.person[1]).replace(/\bcliente\b/g, p.person[0])
}
