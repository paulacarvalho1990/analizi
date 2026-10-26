import React from 'react'
import { ArrowDownRight, ArrowUpRight, Info, Lightbulb } from 'lucide-react'

export interface MetricDefinition {
  caption: string
  what: string
  why: string
  tip?: string
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  'Sessões': {
    caption: 'O número de visitas que seu site recebeu',
    what: 'Período contínuo de navegação de um visitante no site até 30 minutos de inatividade.',
    why: 'Cada visita representa uma oportunidade de negócio para apresentar sua marca ou converter.',
    tip: 'Invista em conteúdos atrativos e campanhas com links diretos para aumentar as visitas.'
  },
  'Visualizações de páginas': {
    caption: 'Total de páginas abertas pelos visitantes',
    what: 'Quantidade total de páginas carregadas e vistas no período, somando múltiplos acessos.',
    why: 'Demonstra o volume total de interesse e consumo de conteúdo no seu site.',
    tip: 'Crie links internos entre páginas para incentivar os visitantes a explorar mais áreas.'
  },
  'Visualizações de página': {
    caption: 'Total de páginas abertas pelos visitantes',
    what: 'Quantidade total de páginas carregadas e vistas no período, somando múltiplos acessos.',
    why: 'Demonstra o volume total de interesse e consumo de conteúdo no seu site.',
    tip: 'Crie links internos entre páginas para incentivar os visitantes a explorar mais áreas.'
  },
  'Visualizações': {
    caption: 'Total de páginas abertas pelos visitantes',
    what: 'Quantidade total de páginas carregadas e vistas no período, somando múltiplos acessos.',
    why: 'Demonstra o volume total de interesse e consumo de conteúdo no seu site.',
    tip: 'Crie links internos entre páginas para incentivar os visitantes a explorar mais áreas.'
  },
  'Usuários': {
    caption: 'Pessoas únicas que acessaram seu site',
    what: 'Indivíduos únicos identificados que navegaram no site no período (sem duplicar repetições).',
    why: 'Mede o alcance real em número de pessoas que conhecem ou interagem com seu negócio.',
    tip: 'Trabalhe em parcerias, SEO e redes sociais para atrair novos visitantes únicos.'
  },
  'Novos usuários': {
    caption: 'Visitantes que entraram pela primeira vez',
    what: 'Visitantes que nunca haviam acessado seu site antes da data atual.',
    why: 'Indica a capacidade do seu negócio de renovar público e conquistar novos clientes.',
    tip: 'Avalie suas campanhas pagas e orgânicas para garantir atração constante de novos visitantes.'
  },
  'Tempo de atenção': {
    caption: 'Tempo médio que o visitante passou navegando',
    what: 'Duração média em que os visitantes permaneceram com o site aberto e interagindo ativamente.',
    why: 'Visitantes que passam mais tempo prestando atenção têm muito mais chance de comprar.',
    tip: 'Torne o conteúdo fácil de ler, com títulos claros e respostas rápidas ao que o cliente busca.'
  },
  'Contatos iniciados': {
    caption: 'Visitantes que clicaram para falar ou cadastrar',
    what: 'Soma de cliques em WhatsApp, formulários, e-mails, telefones ou botões de lead no site.',
    why: 'É a métrica comercial mais importante: indica quantas pessoas quiseram virar clientes.',
    tip: 'Mantenha botões de contato destacados e visíveis em todas as páginas importantes.'
  },
  'WhatsApp': {
    caption: 'Cliques diretos no seu botão do WhatsApp',
    what: 'Total de vezes que alguém clicou para iniciar conversa com você pelo WhatsApp.',
    why: 'O WhatsApp é o canal mais rápido e com maior taxa de fechamento de negócios.',
    tip: 'Mantenha um botão flutuante e atenda rapidamente para aproveitar o momento de interesse.'
  },
  'Cadastros': {
    caption: 'Formulários de inscrição ou leads recebidos',
    what: 'Pessoas que enviaram dados de cadastro, inscrição ou pedido de orçamento pelo site.',
    why: 'Constrói sua base própria de contatos e potenciais clientes para atendimento posterior.',
    tip: 'Peça apenas as informações indispensáveis para não afastar quem tem pressa.'
  },
  'Logins': {
    caption: 'Acessos de usuários na área restrita',
    what: 'Contagem de acessos autenticados e entradas na área do cliente ou plataforma.',
    why: 'Mede o engajamento e a frequência de uso de clientes que já compraram ou usam o sistema.',
    tip: 'Facilite o botão de login no cabeçalho superior para que o cliente acesse em 1 clique.'
  },
  'Taxa de contato': {
    caption: 'Percentual de visitas que geraram contato',
    what: 'Porcentagem de sessões que resultaram em clique de contato ou formulário enviado.',
    why: 'Indica a eficiência do seu site em converter visitantes curiosos em leads quentes.',
    tip: 'Se estiver abaixo de 2%, reforce depoimentos, clareza da oferta e garantias.'
  },
  'Taxa de conversão': {
    caption: 'Percentual de visitas que geraram contato',
    what: 'Porcentagem das visitas totais que completaram uma ação de contato ou cadastro.',
    why: 'Mede o poder de persuasão do seu site para transformar visitas em oportunidades.',
    tip: 'Torne a oferta irresistível e reduza o número de passos até o contato.'
  },
  'Origem principal': {
    caption: 'Canal de onde chegou a maior parte do público',
    what: 'Canal de divulgação que trouxe o maior volume absoluto de visitantes para o site.',
    why: 'Mostra onde seus esforços de marketing estão dando mais retorno financeiro e tráfego.',
    tip: 'Invista ainda mais no canal vencedor e teste novas abordagens nos canais menores.'
  },
  'Localização principal': {
    caption: 'Cidade e estado com maior volume de acessos',
    what: 'Região geográfica (Cidade, Estado e País) de onde partiu a maior parcela de visitas do seu site.',
    why: 'Ajuda a direcionar anúncios regionais, frete, atendimento local e ofertas para onde seu público realmente está.',
    tip: 'Use as cidades do topo para segmentar campanhas no Instagram, Google Ads e personalizar sua comunicação.'
  },
  'Páginas acompanhadas': {
    caption: 'Total de links diferentes acessados no site',
    what: 'Quantidade de URLs distintas do site que tiveram pelo menos uma visualização no período.',
    why: 'Mapeia a diversidade de seções que seu público está conseguindo encontrar e navegar.',
    tip: 'Páginas esquecidas devem ser linkadas na página inicial ou no menu de navegação.'
  },
  'Página mais vista': {
    caption: 'A página com maior interesse e audiência',
    what: 'A página específica do seu site que recebeu a maior fatia de acessos de todo o período.',
    why: 'É a vitrine principal do seu negócio: quem entra no seu site passa por ela.',
    tip: 'Garanta carregamento veloz, informações atualizadas e chamadas de WhatsApp bem visíveis.'
  },
  'Taxa média de saída': {
    caption: 'Visitantes que saíram sem interagir no site',
    what: 'Porcentagem de visualizações em que o visitante encerrou a navegação sem clicar em nada.',
    why: 'Quanto menor, melhor! Taxa de saída alta pode significar que a página não agradou.',
    tip: 'Coloque a informação mais importante no topo da página e dê uma opção clara de próximo passo.'
  },
  'Velocidade média': {
    caption: 'Tempo que as páginas levam para abrir',
    what: 'Duração média do carregamento completo da página (Core Web Vitals navigation timing).',
    why: 'Páginas que demoram mais de 3 segundos para carregar perdem até 53% dos visitantes antes mesmo da primeira leitura.',
    tip: 'Comprima imagens pesadas e evite excesso de scripts externos que atrasam a abertura.'
  },
  'Velocidade média de carregamento': {
    caption: 'Tempo que as páginas levam para abrir',
    what: 'Duração média do carregamento completo da página (Core Web Vitals navigation timing).',
    why: 'Páginas que demoram mais de 3 segundos para carregar perdem até 53% dos visitantes antes mesmo da primeira leitura.',
    tip: 'Comprima imagens pesadas e evite excesso de scripts externos que atrasam a abertura.'
  },
  'Melhor anúncio / criativo': {
    caption: 'Criativo com maior geração de contatos comerciais',
    what: 'O anúncio específico (utm_content) com o maior número de leads e contatos gerados.',
    why: 'Permite identificar qual criativo traz clientes reais, e não apenas curiosos.',
    tip: 'Aumente a verba diária deste anúncio e crie variações mantendo o mesmo gancho.'
  },
  'Tráfego Orgânico vs. Pago': {
    caption: 'Comparativo entre visitantes espontâneos e anúncios pagos',
    what: 'Separação entre pessoas que entraram espontaneamente (Google, direto) e tráfego pago (Meta Ads, Google Ads).',
    why: 'Indica a sustentabilidade do negócio e o retorno de cada canal de aquisição.',
    tip: 'Combine SEO de longo prazo com anúncios focados em conversão direta.'
  },
  'Downloads de arquivos': {
    caption: 'Arquivos baixados pelos visitantes',
    what: 'Contagem de cliques em links de download de PDFs, planilhas, documentos e instaladores.',
    why: 'Indica alto interesse em materiais educativos, orçamentos, tabelas de preço ou softwares.',
    tip: 'Ofereça materiais ricos e de fácil leitura para capturar interesse qualificado.'
  },
  'Cliques de saída': {
    caption: 'Cliques para sites externos',
    what: 'Cliques em links que direcionam o visitante para domínios fora do seu site.',
    why: 'Ajuda a rastrear parcerias, redes sociais, ferramentas externas ou perda de tráfego.',
    tip: 'Use links externos com target="_blank" para manter o seu site aberto na aba original.'
  },
  'Abandono de formulário': {
    caption: 'Visitantes que começaram mas não enviaram',
    what: 'Taxa de formulários que receberam foco em algum campo, mas o visitante saiu sem enviar.',
    why: 'Formulários longos ou confusos costumam perder potenciais clientes no meio do caminho.',
    tip: 'Diminua a quantidade de campos obrigatórios e remova perguntas desnecessárias.'
  },
  'Páginas por visita': {
    caption: 'Média de páginas navegadas em cada visita',
    what: 'Quantidade média de páginas carregadas pelo usuário ao longo de uma sessão contínua.',
    why: 'Demonstra a profundidade da navegação e o interesse em conhecer mais detalhes da sua oferta.',
    tip: 'Use links internos inteligentes e botões de recomendação para estimular a leitura de outras páginas.'
  },
  'Taxa de engajamento': {
    caption: 'Visitas com interação real no site',
    what: 'Porcentagem de sessões que duraram 10s ou mais, visualizaram 2+ páginas ou iniciaram um contato.',
    why: 'Padrão moderno do GA4 que substitui a rejeição: mede o tráfego qualificado que realmente prestou atenção.',
    tip: 'Garanta títulos chamativos e conteúdo escaneável logo no primeiro scroll.'
  },
  'Usuários recorrentes': {
    caption: 'Pessoas que já conheciam o site e voltaram',
    what: 'Visitantes que já haviam acessado seu site em dias anteriores e retornaram para uma nova visita.',
    why: 'Mede fidelidade e ciclo de decisão: a maioria das compras acontece na 2ª ou 3ª visita ao site.',
    tip: 'Divulgue novidades nas redes sociais e use e-mails informativos para trazer o público de volta.'
  }
}

export function MetricCard({
  title,
  value,
  subtitle,
  variation,
  good = true,
  note,
  caption,
  tooltipWhat,
  tooltipWhy,
  tooltipTip,
  compactText = false,
}: {
  title: string
  value: React.ReactNode
  subtitle?: React.ReactNode
  variation?: string
  good?: boolean
  note?: string
  caption?: string
  tooltipWhat?: string
  tooltipWhy?: string
  tooltipTip?: string
  compactText?: boolean
}) {
  const def = METRIC_DEFINITIONS[title]
  const finalCaption = caption || def?.caption || note
  const what = tooltipWhat || def?.what
  const why = tooltipWhy || def?.why
  const tip = tooltipTip || def?.tip

  return (
    <article className="metric-card" title={`${title}: ${typeof value === 'string' ? value : ''}`}>
      <div className="metric-title">
        <span>{title}</span>
        {(what || why) && (
          <div className="metric-info-wrapper" tabIndex={0} aria-label={`Informações sobre ${title}`}>
            <Info size={14} className="metric-info-icon" />
            <div className="metric-tooltip-popover" role="tooltip">
              <div className="metric-tooltip-title">{title}</div>
              {what && (
                <div className="metric-tooltip-section">
                  <b>O que significa:</b>
                  <p>{what}</p>
                </div>
              )}
              {why && (
                <div className="metric-tooltip-section">
                  <b>Por que importa:</b>
                  <p>{why}</p>
                </div>
              )}
              {tip && (
                <div className="metric-tooltip-section tip">
                  <b>
                    <Lightbulb size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4, color: '#fbbf24' }} />
                    Como melhorar:
                  </b>
                  <p>{tip}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <strong
        className={compactText ? 'compact-text' : (subtitle ? 'has-subtitle' : '')}
        style={compactText ? { fontSize: '15px', fontWeight: 700, lineHeight: 1.35, wordBreak: 'break-word', whiteSpace: 'normal', letterSpacing: '-0.01em', marginBottom: 6 } : undefined}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </strong>

      {subtitle && (
        <span className="metric-subtitle" title={typeof subtitle === 'string' ? subtitle : undefined}>
          {subtitle}
        </span>
      )}

      {variation && (
        <span className={good ? 'variation positive' : 'variation negative'}>
          {good ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
          {variation} <em>vs. período anterior</em>
        </span>
      )}

      {note && note !== finalCaption && <small>{note}</small>}

      {finalCaption && <div className="metric-caption">{finalCaption}</div>}
    </article>
  )
}

export function DualMetricCard({
  title = "Tráfego Orgânico vs. Pago",
  organicSessions = 0,
  organicShare = "—",
  organicContacts = 0,
  organicConvRate = "—",
  paidSessions = 0,
  paidShare = "—",
  paidContacts = 0,
  paidConvRate = "—",
  caption = "Comparativo de volume e conversão entre busca espontânea e anúncios pagos"
}: {
  title?: string
  organicSessions?: number | string
  organicShare?: string
  organicContacts?: number | string
  organicConvRate?: string
  paidSessions?: number | string
  paidShare?: string
  paidContacts?: number | string
  paidConvRate?: string
  caption?: string
}) {
  const def = METRIC_DEFINITIONS[title]

  return (
    <article className="dual-metric-card" style={{ gridColumn: 'span 2' }}>
      <div className="metric-title">
        <span>{title}</span>
        <div className="metric-info-wrapper" tabIndex={0} aria-label={`Informações sobre ${title}`}>
          <Info size={14} className="metric-info-icon" />
          <div className="metric-tooltip-popover" role="tooltip">
            <div className="metric-tooltip-title">{title}</div>
            <div className="metric-tooltip-section">
              <b>O que significa:</b>
              <p>{def?.what || "Separação entre visitantes vindos de anúncios pagos e visitantes de busca ou acesso espontâneo."}</p>
            </div>
            <div className="metric-tooltip-section">
              <b>Por que importa:</b>
              <p>{def?.why || "Mostra se seu negócio é dependente de anúncios ou se tem autoridade própria de busca."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dual-metric-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '8px 0 12px' }}>
        <div className="dual-side organic" style={{ padding: '10px 12px', borderRadius: '9px', background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3B82F6' }}>Orgânico / Espontâneo</span>
            <span style={{ fontSize: '10px', fontWeight: 750, padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#2563EB' }}>{organicShare}</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{organicSessions}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', marginTop: 4, display: 'flex', gap: '8px' }}>
            <span>Contatos: <b style={{ color: 'var(--foreground)' }}>{organicContacts}</b></span>
            <span>Conv: <b style={{ color: '#10B981' }}>{organicConvRate}</b></span>
          </div>
        </div>

        <div className="dual-side paid" style={{ padding: '10px 12px', borderRadius: '9px', background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#FF3CAC' }}>Tráfego Pago (Ads)</span>
            <span style={{ fontSize: '10px', fontWeight: 750, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 60, 172, 0.15)', color: '#DB2777' }}>{paidShare}</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{paidSessions}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', marginTop: 4, display: 'flex', gap: '8px' }}>
            <span>Contatos: <b style={{ color: 'var(--foreground)' }}>{paidContacts}</b></span>
            <span>Conv: <b style={{ color: '#10B981' }}>{paidConvRate}</b></span>
          </div>
        </div>
      </div>

      <div className="metric-caption">{caption}</div>
    </article>
  )
}
