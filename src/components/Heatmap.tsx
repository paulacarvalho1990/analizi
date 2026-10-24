import React, { useEffect, useState } from 'react'
import {
  Flame, Monitor, Smartphone, MousePointer, ArrowDown, RefreshCw, Clock,
  Image as ImageIcon, Video, Type, CheckSquare, Layout, Sparkles, Navigation,
  CreditCard, Flag, TextCursorInput, Link as LinkIcon
} from 'lucide-react'
import { MetricCard } from './Metrics'
import { useBusiness } from '../lib/business-context'

interface LayoutBlock {
  type: string
  top: number
  left: number
  width: number
  height: number
  label?: string
}

interface HeatmapClick {
  x_pct: number
  y_px: number
  tag: string
  label: string
  count: number
}

interface ScrollRetention {
  visitors: number
  percentage: number
}

interface HeatmapPayload {
  pagePath: string
  deviceType: string
  availablePages: string[]
  totalVisitors: number
  layout: {
    viewportWidth: number
    viewportHeight: number
    pageHeight: number
    updatedAt: string
    blocks: LayoutBlock[]
  } | null
  clicks: HeatmapClick[]
  scrollRetention: Record<string, ScrollRetention>
}

function RenderWireframeBlock({ block, baseWidth }: { block: LayoutBlock; baseWidth: number }) {
  const bTop = block.top
  const bLeft = block.left
  const bWidth = block.width
  const bHeight = block.height
  const type = block.type || 'section'
  const label = block.label || ''

  // Calcula z-index e nível para evitar que texto/botão fique encoberto por fundos ou seções
  let zIndex = 1
  let opacity = 0.95
  if (type === 'section' || type === 'header' || type === 'footer') {
    zIndex = 1
    opacity = 0.4
  } else if (type === 'banner' || type === 'card') {
    zIndex = 2
    opacity = 0.75
  } else if (type === 'image' || type === 'video') {
    zIndex = 3
    opacity = 0.9
  } else if (type === 'heading' || type === 'form') {
    zIndex = 4
    opacity = 0.95
  } else if (type === 'button' || type === 'link' || type === 'input') {
    zIndex = 5
    opacity = 1
  }

  const style: React.CSSProperties = {
    top: `${bTop}px`,
    left: `${Math.max(0, bLeft)}px`,
    width: `${Math.max(20, bWidth)}px`,
    height: `${Math.max(16, bHeight)}px`,
    zIndex,
    opacity
  }

  // Placeholder completo para Imagem
  if (type === 'image' || type === 'image-link') {
    return (
      <div className="wireframe-block wireframe-image" style={style} title={`IMAGEM: ${label}`}>
        <div className="wireframe-image-inner">
          <ImageIcon size={bHeight > 80 ? 28 : 16} className="wireframe-svg-icon" />
          <span className="block-label">{label || 'Imagem / Mídia'}</span>
        </div>
      </div>
    )
  }

  // Placeholder completo para Vídeo
  if (type === 'video') {
    return (
      <div className="wireframe-block wireframe-video" style={style} title={`VÍDEO: ${label}`}>
        <div className="wireframe-video-inner">
          <Video size={bHeight > 80 ? 26 : 16} className="wireframe-svg-icon" />
          <span className="block-label">{label || 'Vídeo incorporado'}</span>
        </div>
      </div>
    )
  }

  // Placeholder completo para Botão
  if (type === 'button') {
    return (
      <div className="wireframe-block wireframe-button" style={style} title={`BOTÃO: ${label}`}>
        <CheckSquare size={13} className="wireframe-svg-icon" />
        <span className="block-label">{label || 'Botão de Ação'}</span>
      </div>
    )
  }

  // Placeholder completo para Formulário
  if (type === 'form') {
    return (
      <div className="wireframe-block wireframe-form" style={style} title={`FORMULÁRIO: ${label}`}>
        <div className="wireframe-form-header">
          <TextCursorInput size={14} className="wireframe-svg-icon" />
          <span className="block-label">{label || 'Formulário de Contato / Inscrição'}</span>
        </div>
        {bHeight > 70 && (
          <div className="wireframe-form-fake-inputs">
            <div className="fake-input-row" />
            <div className="fake-input-row short" />
          </div>
        )}
      </div>
    )
  }

  // Placeholder completo para Input isolado
  if (type === 'input') {
    return (
      <div className="wireframe-block wireframe-input" style={style} title={`CAMPO DE TEXTO: ${label}`}>
        <TextCursorInput size={12} className="wireframe-svg-icon" />
        <span className="block-label">{label || 'Campo de entrada'}</span>
      </div>
    )
  }

  // Placeholder completo para Banner / Hero
  if (type === 'banner') {
    return (
      <div className="wireframe-block wireframe-banner" style={style} title={`BANNER: ${label}`}>
        <div className="wireframe-banner-accent" />
        <Flag size={14} className="wireframe-svg-icon" />
        <span className="block-label">{label || 'Banner Promocional / Destaque'}</span>
      </div>
    )
  }

  // Placeholder completo para Card
  if (type === 'card') {
    return (
      <div className="wireframe-block wireframe-card" style={style} title={`CARD: ${label}`}>
        <CreditCard size={14} className="wireframe-svg-icon" />
        <span className="block-label">{label || 'Card de Conteúdo'}</span>
      </div>
    )
  }

  // Placeholder completo para Título / Heading
  if (type === 'heading') {
    return (
      <div className="wireframe-block wireframe-heading" style={style} title={`TÍTULO: ${label}`}>
        <Type size={14} className="wireframe-svg-icon" />
        <span className="block-label">{label || 'Título da Seção'}</span>
      </div>
    )
  }

  // Placeholder para Header ou Navegação
  if (type === 'header' || type === 'nav') {
    return (
      <div className="wireframe-block wireframe-header" style={style} title={`CABEÇALHO: ${label}`}>
        <Navigation size={14} className="wireframe-svg-icon" />
        <span className="block-label">{label || 'Cabeçalho / Navegação'}</span>
      </div>
    )
  }

  // Placeholder para Link comum
  if (type === 'link') {
    return (
      <div className="wireframe-block wireframe-link" style={style} title={`LINK: ${label}`}>
        <LinkIcon size={12} className="wireframe-svg-icon" />
        <span className="block-label">{label || 'Link'}</span>
      </div>
    )
  }

  // Fallback padrão: Seção estrutural
  return (
    <div className="wireframe-block wireframe-section" style={style} title={`SEÇÃO: ${label}`}>
      <Layout size={13} className="wireframe-svg-icon" />
      <span className="block-label">{label || 'Bloco / Seção'}</span>
    </div>
  )
}

export function Heatmap() {
  const { currentSite } = useBusiness()
  const [selectedPage, setSelectedPage] = useState<string>('/')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [activeLayer, setActiveLayer] = useState<'clicks' | 'scroll'>('clicks')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HeatmapPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const targetSiteId = currentSite?.tracker_site_id || (currentSite?.id?.startsWith('ANLZ') ? currentSite.id : '')

  const fetchHeatmap = async (page = selectedPage, dev = device) => {
    if (!targetSiteId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://analizi.carvalhopaula1990.workers.dev/v1/heatmap/${targetSiteId}?page=${encodeURIComponent(page)}&device=${dev}&period=30`)
      if (!res.ok) throw new Error('Falha ao carregar dados do heatmap.')
      const json: HeatmapPayload = await res.json()
      setData(json)
      if (json.availablePages?.length && !json.availablePages.includes(page)) {
        setSelectedPage(json.availablePages[0])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados do heatmap.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (targetSiteId) {
      fetchHeatmap(selectedPage, device)
    }
  }, [targetSiteId, selectedPage, device])

  const layout = data?.layout
  const blocks = layout?.blocks || []
  const pageHeight = Math.max(layout?.pageHeight || 1200, 800)
  const baseWidth = device === 'mobile' ? 390 : Math.max(layout?.viewportWidth || 1200, 1100)
  const clicks = data?.clicks || []
  const maxClickCount = Math.max(...clicks.map((c) => c.count), 1)

  return (
    <div className="heatmap-container">
      <header className="page-header">
        <div>
          <span className="eyebrow">COMPORTAMENTO VISUAL</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame style={{ color: '#f97316' }} size={28} /> Heatmap & Comportamento
          </h1>
          <p className="subtitle">
            Veja exatamente onde os visitantes clicam e até que altura da página eles rolam.
          </p>
        </div>
      </header>

      {/* Barra de Controles e Filtros */}
      <div className="heatmap-toolbar">
        <div className="heatmap-control-group">
          <label htmlFor="page-select">Página:</label>
          <select
            id="page-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="heatmap-select"
          >
            {data?.availablePages && data.availablePages.length > 0 ? (
              data.availablePages.map((p) => (
                <option key={p} value={p}>
                  {p === '/' ? '/ (Página Inicial)' : p}
                </option>
              ))
            ) : (
              <option value="/">/ (Página Inicial)</option>
            )}
          </select>
        </div>

        {/* Seletor Dispositivo */}
        <div className="heatmap-segmented-control">
          <button
            type="button"
            className={device === 'desktop' ? 'active' : ''}
            onClick={() => setDevice('desktop')}
          >
            <Monitor size={15} /> Desktop
          </button>
          <button
            type="button"
            className={device === 'mobile' ? 'active' : ''}
            onClick={() => setDevice('mobile')}
          >
            <Smartphone size={15} /> Mobile
          </button>
        </div>

        {/* Camadas: Cliques ou Scroll */}
        <div className="heatmap-segmented-control">
          <button
            type="button"
            className={activeLayer === 'clicks' ? 'active' : ''}
            onClick={() => setActiveLayer('clicks')}
          >
            <MousePointer size={15} /> Mapa de Cliques ({clicks.reduce((acc, c) => acc + c.count, 0)})
          </button>
          <button
            type="button"
            className={activeLayer === 'scroll' ? 'active' : ''}
            onClick={() => setActiveLayer('scroll')}
          >
            <ArrowDown size={15} /> Profundidade de Scroll
          </button>
        </div>

        <button
          type="button"
          onClick={() => fetchHeatmap()}
          className="heatmap-refresh-btn"
          title="Recarregar dados"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Mensagem quando não foi possível carregar o heatmap ou ainda não há layout */}
      {!loading && !layout ? (
        <div className="heatmap-empty-card">
          <div className="heatmap-empty-icon-box">
            <Clock size={32} />
          </div>
          <h3>Não foi possível carregar o heatmap</h3>
          <p>
            Aguarde a coleta dos dados e volte em 24h. O mapa de cliques e a profundidade de rolagem desta página serão renderizados automaticamente assim que os visitantes navegarem por ela.
          </p>
          <span className="heatmap-empty-badge">
            Página selecionada: {selectedPage}
          </span>
        </div>
      ) : (
        <>
          {/* Resumo do Scroll no padrão dos cards de métricas das outras páginas */}
          {activeLayer === 'scroll' && data?.scrollRetention && (
            <section className="metrics">
              <MetricCard
                title="Topo (até 25%)"
                value={`${data.scrollRetention['25%']?.percentage || 100}%`}
                caption="Visualizaram o topo"
                tooltipWhat="Porcentagem de visitantes que viram a dobra inicial da página."
                tooltipWhy="Mede a taxa de permanência imediata de quem acessa o seu site."
                tooltipTip="Garanta que sua proposta de valor e CTA principal estejam visíveis aqui."
              />
              <MetricCard
                title="Dobra média (50%)"
                value={`${data.scrollRetention['50%']?.percentage || 0}%`}
                caption="Continuaram rolando"
                tooltipWhat="Percentual de visitantes que rolaram até a metade do conteúdo."
                tooltipWhy="Indica se a introdução e o início do site foram atraentes o suficiente para gerar interesse."
                tooltipTip="Adicione tópicos dinâmicos ou prévia de benefícios para engajar a leitura."
              />
              <MetricCard
                title="Conteúdo baixo (75%)"
                value={`${data.scrollRetention['75%']?.percentage || 0}%`}
                caption="Chegaram ao terço final"
                tooltipWhat="Visitantes que consumiram a maior parte das informações da página."
                tooltipWhy="Representa um público altamente qualificado e com interesse real na oferta."
                tooltipTip="Posicione depoimentos e garantias nesta área para eliminar dúvidas finais."
              />
              <MetricCard
                title="Fim da página (100%)"
                value={`${data.scrollRetention['100%']?.percentage || 0}%`}
                caption="Leram até o fim"
                tooltipWhat="Percentual de visitantes que rolaram a página inteira até o rodapé."
                tooltipWhy="Mostra o engajamento máximo e a profundidade de leitura dos usuários mais atentos."
                tooltipTip="Não deixe o rodapé vazio: coloque um botão de contato ou formulário de fechamento."
              />
            </section>
          )}

          {/* Área do Wireframe + Heatmap com Scroll Lateral Suave e Contido */}
          <div className="heatmap-canvas-wrapper">
            <div
              className={`heatmap-canvas ${device}`}
              style={{
                width: device === 'mobile' ? '390px' : `${baseWidth}px`,
                minWidth: device === 'mobile' ? '390px' : `${baseWidth}px`,
                minHeight: `${pageHeight}px`,
                position: 'relative'
              }}
            >
              {/* Wireframe Sintético (Placeholders Estruturais e Ricos) */}
              <div className="wireframe-layer" style={{ height: `${pageHeight}px` }}>
                {blocks.map((block, idx) => (
                  <RenderWireframeBlock key={idx} block={block} baseWidth={baseWidth} />
                ))}
              </div>

              {/* Camada 1: Cliques (Pontos térmicos sobrepostos) */}
              {activeLayer === 'clicks' && (
                <div className="heatmap-layer-clicks" style={{ height: `${pageHeight}px` }}>
                  {clicks.map((click, i) => {
                    const intensity = Math.min(1, click.count / maxClickCount)
                    const size = Math.round(36 + intensity * 28)
                    const hue = Math.round(180 - intensity * 180) // 180 (azul frio) a 0 (vermelho quente)
                    return (
                      <div
                        key={i}
                        className="heatmap-click-point"
                        style={{
                          left: `${click.x_pct}%`,
                          top: `${click.y_px}px`,
                          width: `${size}px`,
                          height: `${size}px`,
                          background: `radial-gradient(circle, hsla(${hue}, 100%, 50%, 0.85) 0%, hsla(${hue}, 100%, 50%, 0.35) 45%, transparent 75%)`
                        }}
                        title={`${click.count} clique(s) em: ${click.label || click.tag}`}
                      >
                        <span className="heatmap-click-badge">{click.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Camada 2: Scroll Depth (Gradiente vertical com linhas guias) */}
              {activeLayer === 'scroll' && data?.scrollRetention && (
                <div className="heatmap-layer-scroll" style={{ height: `${pageHeight}px` }}>
                  {[
                    { label: 'Dobra Superior (25%)', pct: 25, data: data.scrollRetention['25%'] },
                    { label: 'Metade da Página (50%)', pct: 50, data: data.scrollRetention['50%'] },
                    { label: 'Três Quartos (75%)', pct: 75, data: data.scrollRetention['75%'] },
                    { label: 'Rodapé Completo (100%)', pct: 98, data: data.scrollRetention['100%'] }
                  ].map((line, idx) => (
                    <div
                      key={idx}
                      className="scroll-guideline"
                      style={{ top: `${(pageHeight * line.pct) / 100}px` }}
                    >
                      <div className="scroll-tag">
                        <b>{line.label}</b>
                        <span>{line.data?.percentage || 0}% dos visitantes atingiram</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
