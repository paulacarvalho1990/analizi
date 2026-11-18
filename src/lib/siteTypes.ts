// Tipo de site → quais resultados aparecem na página Resultados.
// Todos os eventos são capturados em todos os sites; o tipo só muda a visualização.

export type SiteType = 'servicos' | 'agendamento' | 'ecommerce' | 'saas' | 'reservas' | 'conteudo'

export const SITE_TYPES: Record<SiteType, { label: string; hint: string }> = {
  servicos: { label: 'Captação de contatos', hint: 'Pedidos de contato e orçamento' },
  agendamento: { label: 'Agendamentos', hint: 'Clínicas, consultórios e agenda online' },
  ecommerce: { label: 'Loja virtual', hint: 'Venda com carrinho e checkout' },
  saas: { label: 'SaaS e assinaturas', hint: 'Cadastros, logins e planos pagos' },
  reservas: { label: 'Reservas', hint: 'Hotéis, restaurantes e eventos' },
  conteudo: { label: 'Conteúdo e infoprodutos', hint: 'Materiais, cursos e produtos digitais' },
}

export const SITE_TYPE_OPTIONS = Object.entries(SITE_TYPES) as Array<[SiteType, (typeof SITE_TYPES)[SiteType]]>

export const isSiteType = (value: unknown): value is SiteType => typeof value === 'string' && value in SITE_TYPES

/** Sugestão inicial a partir do segmento escolhido no cadastro. */
export function suggestSiteType(segment?: string, subsegment?: string): SiteType {
  const text = `${segment || ''} ${subsegment || ''}`.toLowerCase()
  if (/hotel|pousada|restaurante|evento|turismo/.test(text)) return 'reservas'
  if (/software|saas|aplicativo|app\b/.test(text)) return 'saas'
  if (/curso|educa|infoproduto/.test(text)) return 'conteudo'
  if (/product|produto|loja|moda|aliment/.test(text)) return 'ecommerce'
  if (/health|sa[uú]de|cl[ií]nica|odonto|psico|fisio|nutri|dermato|beleza|est[ée]tica/.test(text)) return 'agendamento'
  return 'servicos'
}
