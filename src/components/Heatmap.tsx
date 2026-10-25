import React, { useEffect, useRef, useState } from 'react'
import {
  Flame, Monitor, Smartphone, MousePointer, ArrowDown, RefreshCw, Clock,
  Image as ImageIcon, Video, Type, CheckSquare, Layout, Navigation,
  CreditCard, Flag, TextCursorInput, Link as LinkIcon,
  BarChart3, SlidersHorizontal, Table as TableIcon, MapPin, HelpCircle,
  MessageSquareQuote, Volume2, GalleryHorizontal, ZoomIn, ZoomOut, Maximize2
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

/**
 * Filtra e organiza blocos estruturais para garantir que NENHUM visual fique empilhado
 * ou sobreposto no wireframe. Gráficos, vídeos, mapas, filtros, tabelas, FAQs e elementos interativos têm prioridade.
 */
function buildNonOverlappingBlocks(rawBlocks: LayoutBlock[], pageHeight: number, targetViewportWidth: number): LayoutBlock[] {
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return []

  const priorityMap: Record<string, number> = {
    chart: 12,
    video: 12,
    map: 12,
    audio: 11,
    filter: 11,
    table: 11,
    faq: 10,
    testimonial: 10,
    carousel: 10,
    button: 10,
    input: 10,
    form: 9,
    image: 8,
    'image-link': 8,
    link: 7,
    heading: 7,
    card: 6,
    banner: 4,
    header: 3,
    nav: 3,
    footer: 3,
    section: 1
  }

  // 1. Normaliza, infere tipos compostos (chart, filter, table, faq, video, map, testimonial), ajusta limites laterais e remove wrappers gigantes
  const valid = rawBlocks
    .map((b) => {
      const rawLabel = String(b.label || '').replace(/\s+/g, ' ').trim()
      let inferredType = b.type || 'section'
      if (inferredType === 'card' || inferredType === 'section') {
        if (/^(gr[aá]fico|visualiza[cç][oõ]es ao longo|visualiza[cç][oõ]es por p[aá]gina|origens dos acessos)/i.test(rawLabel)) {
          inferredType = 'chart'
        } else if (/^(filtro|per[ií]odo|agrupar por)/i.test(rawLabel)) {
          inferredType = 'filter'
        } else if (/^(tabela|m[eé]tricas por dia|desempenho das p[aá]ginas|origem por p[aá]gina|a[cç][oõ]es confirmadas|cliques)/i.test(rawLabel)) {
          inferredType = 'table'
        } else if (/(?:d[uú]vidas|perguntas frequentes|faq|acorde[aã]o|passo a passo por plataforma)/i.test(rawLabel)) {
          inferredType = 'faq'
        } else if (/(?:depoimento|avalia[cç][aã]o|o que dizem)/i.test(rawLabel)) {
          inferredType = 'testimonial'
        } else if (/(?:mapa|localiza[cç][aã]o|endere[cç]o)/i.test(rawLabel)) {
          inferredType = 'map'
        }
      }
      const rawLeft = Math.max(0, Math.round(b.left || 0))
      const clampedLeft = Math.min(rawLeft, Math.max(0, targetViewportWidth - 32))
      const maxAllowedWidth = Math.max(24, targetViewportWidth - clampedLeft)
      const clampedWidth = Math.min(Math.max(24, Math.round(b.width || 0)), maxAllowedWidth)
      return {
        ...b,
        type: inferredType,
        top: Math.max(0, Math.round(b.top || 0)),
        left: clampedLeft,
        width: clampedWidth,
        height: Math.max(20, Math.round(b.height || 0)),
        label: rawLabel
      }
    })
    .filter((b) => {
      // Descarta elementos totalmente fora da tela (ex.: slides ocultos de carrossel)
      if ((b.left || 0) >= targetViewportWidth - 16) return false
      // Descarta seções genéricas gigantes que englobam múltiplos blocos
      if (b.type === 'section' && b.height > 450 && b.width > targetViewportWidth * 0.75) return false
      if (b.height > pageHeight * 0.75 && b.height > 900) return false
      return true
    })

  // 2. Se um container genérico (section, banner, header) contém outros blocos menores dentro dele,
  // descartamos o container externo. Já blocos compostos (chart, filter, table, video, map, faq, testimonial, carousel) são preservados inteiros!
  const containsRect = (outer: LayoutBlock, inner: LayoutBlock) => {
    const tol = 8
    return (
      inner.left >= outer.left - tol &&
      inner.top >= outer.top - tol &&
      inner.left + inner.width <= outer.left + outer.width + tol &&
      inner.top + inner.height <= outer.top + outer.height + tol &&
      inner.width * inner.height < outer.width * outer.height * 0.92
    )
  }

  const withoutRedundantContainers = valid.filter((block, idx) => {
    // Se este bloco está dentro de um bloco composto (chart, filter, table, video, map, faq, testimonial, carousel), descarta o filho solto para manter o componente inteiro
    const insideComposite = valid.some(
      (other, oIdx) =>
        oIdx !== idx &&
        ['chart', 'filter', 'table', 'video', 'map', 'audio', 'faq', 'testimonial', 'carousel'].includes(other.type) &&
        containsRect(other, block)
    )
    if (insideComposite) return false

    if (['section', 'banner', 'header', 'heading'].includes(block.type)) {
      const innerChildren = valid.filter((other, oIdx) => oIdx !== idx && containsRect(block, other))
      if (innerChildren.length > 0) {
        return false
      }
    }
    if (block.type === 'card') {
      const innerChildren = valid.filter((other, oIdx) => oIdx !== idx && containsRect(block, other))
      // Só descarta um card se ele for um wrapper gigante com mais de 3 sub-blocos independentes
      if (innerChildren.length > 3) {
        return false
      }
    }
    return true
  })

  // 3. Ordena por prioridade (botões, inputs, imagens, títulos primeiro; menores áreas primeiro)
  const sorted = [...withoutRedundantContainers].sort((a, b) => {
    const pA = priorityMap[a.type] || 1
    const pB = priorityMap[b.type] || 1
    if (pB !== pA) return pB - pA
    return a.width * a.height - b.width * b.height
  })

  // 4. Verificação estrita de colisão (AABB): se dois blocos se sobrepõem, mantém apenas o de maior prioridade
  const accepted: LayoutBlock[] = []
  const isOverlapping = (a: LayoutBlock, b: LayoutBlock) => {
    const gap = 3 // exige pelo menos 3px de respiro ou zero sobreposição significativa
    const xOverlap = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left))
    const yOverlap = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top))
    if (xOverlap <= gap || yOverlap <= gap) return false
    const interArea = xOverlap * yOverlap
    const minArea = Math.min(a.width * a.height, b.width * b.height)
    return interArea / Math.max(1, minArea) > 0.1
  }

  for (const candidate of sorted) {
    const collides = accepted.some((acc) => isOverlapping(acc, candidate))
    if (!collides) {
      accepted.push(candidate)
    }
  }

  // Retorna ordenado visualmente do topo para a base
  return accepted.sort((a, b) => a.top - b.top || a.left - b.left)
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

  // Placeholder completo para Gráfico Matemático / Visualização de Dados
  if (type === 'chart') {
    return (
      <div className="wireframe-block wireframe-chart" style={style} title={`GRÁFICO MATEMÁTICO: ${label}`}>
        <div className="wireframe-chart-header">
          <BarChart3 size={15} className="wireframe-svg-icon" />
          <span className="block-label">{label || 'Gráfico de Métricas / Evolução'}</span>
        </div>
        {bHeight > 110 && (
          <div className="wireframe-chart-bars">
            <span style={{ height: '38%' }} />
            <span style={{ height: '64%' }} />
            <span style={{ height: '52%' }} />
            <span style={{ height: '86%' }} />
            <span style={{ height: '72%' }} />
            <span style={{ height: '45%' }} />
            <span style={{ height: '94%' }} />
          </div>
        )}
      </div>
    )
  }

  // Placeholder completo para Barra de Filtros / Período / Seletores
  if (type === 'filter') {
    return (
      <div className="wireframe-block wireframe-filter" style={style} title={`FILTROS E CONTROLES: ${label}`}>
        <div className="wireframe-filter-header">
          <SlidersHorizontal size={14} className="wireframe-svg-icon" />
          <span className="block-label">{label || 'Filtros de Período, Página, Origem e Atalhos'}</span>
        </div>
        <div className="wireframe-filter-pills">
          <span className="fake-filter-chip">De / Até</span>
          <span className="fake-filter-chip">Agrupar</span>
          <span className="fake-filter-chip">Página</span>
          <span className="fake-filter-chip">Origem</span>
          <span className="fake-filter-chip accent">7d · 30d · 90d</span>
        </div>
      </div>
    )
  }

  // Placeholder completo para Tabela de Dados
  if (type === 'table') {
    return (
      <div className="wireframe-block wireframe-table" style={style} title={`TABELA DE DADOS: ${label}`}>
        <div className="wireframe-table-header">
          <TableIcon size={14} className="wireframe-svg-icon" />
          <span className="block-label">{label || 'Tabela de Métricas e Resultados'}</span>
        </div>
        {bHeight > 110 && (
          <div className="wireframe-table-rows">
            <div className="fake-table-row head" />
            <div className="fake-table-row" />
            <div className="fake-table-row" />
            <div className="fake-table-row" />
          </div>
        )}
      </div>
    )
  }

  // Placeholder completo para Mapa Interativo / Localização
  if (type === 'map') {
    return (
      <div
        className="wireframe-block wireframe-map"
        style={{ ...style, background: '#132524', border: '1px solid #23534e', color: '#99f6e4', padding: 0 }}
        title={`MAPA / LOCALIZAÇÃO: ${label}`}
      >
        <div className="wireframe-map-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '10px', gap: '6px' }}>
          <MapPin size={bHeight > 80 ? 26 : 16} className="wireframe-svg-icon" style={{ color: '#2dd4bf' }} />
          <span className="block-label">{label || 'Mapa Interativo / Localização'}</span>
        </div>
      </div>
    )
  }

  // Placeholder completo para Player de Áudio / Podcast
  if (type === 'audio') {
    return (
      <div
        className="wireframe-block wireframe-audio"
        style={{ ...style, background: '#231b2e', border: '1px solid #4c356b', color: '#e9d5ff' }}
        title={`ÁUDIO / PODCAST: ${label}`}
      >
        <Volume2 size={15} className="wireframe-svg-icon" style={{ color: '#c084fc' }} />
        <span className="block-label">{label || 'Player de Áudio / Podcast'}</span>
      </div>
    )
  }

  // Placeholder completo para FAQ / Acordeão
  if (type === 'faq') {
    return (
      <div
        className="wireframe-block wireframe-faq"
        style={{ ...style, background: '#172030', border: '1px solid #2e415f', color: '#dbeafe', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: '10px 14px', gap: '8px' }}
        title={`FAQ / ACORDEÃO: ${label}`}
      >
        <div className="wireframe-faq-header" style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 700 }}>
          <HelpCircle size={14} className="wireframe-svg-icon" style={{ color: '#60a5fa' }} />
          <span className="block-label">{label || 'Perguntas Frequentes / Acordeão'}</span>
        </div>
        {bHeight > 90 && (
          <div className="wireframe-faq-items" style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <div className="fake-faq-row" style={{ height: '16px', background: 'rgba(96, 165, 250, 0.12)', border: '1px solid rgba(96, 165, 250, 0.28)', borderRadius: '5px', width: '100%' }} />
            <div className="fake-faq-row" style={{ height: '16px', background: 'rgba(96, 165, 250, 0.12)', border: '1px solid rgba(96, 165, 250, 0.28)', borderRadius: '5px', width: '100%' }} />
          </div>
        )}
      </div>
    )
  }

  // Placeholder completo para Depoimento / Prova Social
  if (type === 'testimonial') {
    return (
      <div
        className="wireframe-block wireframe-testimonial"
        style={{ ...style, background: '#241d18', border: '1px solid #433227', borderLeft: '3px solid #f97316', color: '#ffedd5' }}
        title={`DEPOIMENTO: ${label}`}
      >
        <MessageSquareQuote size={15} className="wireframe-svg-icon" style={{ color: '#fb923c' }} />
        <span className="block-label">{label || 'Depoimento / Avaliação de Cliente'}</span>
      </div>
    )
  }

  // Placeholder completo para Carrossel / Slider
  if (type === 'carousel') {
    return (
      <div
        className="wireframe-block wireframe-carousel"
        style={{ ...style, background: '#1a1e2e', border: '1px dashed #4f46e5', color: '#e0e7ff' }}
        title={`CARROSSEL / SLIDER: ${label}`}
      >
        <GalleryHorizontal size={15} className="wireframe-svg-icon" style={{ color: '#818cf8' }} />
        <span className="block-label">{label || 'Carrossel / Galeria Interativa'}</span>
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
  const [zoomMode, setZoomMode] = useState<'fit' | 'compact' | 'actual'>('fit')
  const [customScale, setCustomScale] = useState<number | null>(null)
  const [wrapperWidth, setWrapperWidth] = useState<number>(1000)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

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
  const rawBlocks = layout?.blocks || []
  const maxRawBlockRight = rawBlocks.reduce((max, b) => Math.max(max, (b.left || 0) + (b.width || 0)), 0)
  const targetViewportWidth =
    device === 'mobile'
      ? Math.min(480, Math.max(layout?.viewportWidth || 390, 360))
      : Math.max(layout?.viewportWidth || 1280, Math.min(maxRawBlockRight + 40, 1600), 1280)
  const maxBlockBottom = rawBlocks.reduce((max, b) => Math.max(max, (b.top || 0) + (b.height || 0)), 0)
  const pageHeight = Math.max(layout?.pageHeight || 1200, maxBlockBottom + 80, 800)
  const blocks = buildNonOverlappingBlocks(rawBlocks, pageHeight, targetViewportWidth)
  const baseWidth = targetViewportWidth
  const clicks = data?.clicks || []
  const maxClickCount = Math.max(...clicks.map((c) => c.count), 1)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const updateWidth = () => {
      const w = el.clientWidth
      if (w > 0) setWrapperWidth(w)
    }
    updateWidth()
    const observer = new ResizeObserver(() => updateWidth())
    observer.observe(el)
    window.addEventListener('resize', updateWidth)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [layout, device])

  // Calcula o fator de escala (zoom out) para que a réplica da página caiba perfeitamente sem scroll lateral
  const availableCanvasWidth = Math.max(240, wrapperWidth - 48)
  const fitScale = Math.min(1, Number((availableCanvasWidth / baseWidth).toFixed(3)))
  const defaultDeviceScale = device === 'mobile' ? Math.min(fitScale, 0.85) : Math.min(fitScale, 0.72)
  const activeScale =
    customScale !== null
      ? customScale
      : zoomMode === 'fit'
      ? defaultDeviceScale
      : zoomMode === 'compact'
      ? Math.min(fitScale, device === 'mobile' ? 0.65 : 0.5)
      : 1

  const scaledWidth = Math.round(baseWidth * activeScale)
  const scaledHeight = Math.round(pageHeight * activeScale)

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

          {/* Legenda de Cores do Mapa de Cliques */}
          {activeLayer === 'clicks' && (
            <div className="heatmap-color-legend" aria-label="Legenda de intensidade de cliques">
              <div className="heatmap-legend-title">
                <Flame size={15} />
                <b>Intensidade de Cliques:</b>
              </div>
              <div className="heatmap-legend-scale">
                <span className="heatmap-legend-label">Menos cliques (Frio)</span>
                <div className="heatmap-legend-gradient" />
                <span className="heatmap-legend-label">Mais cliques (Quente)</span>
              </div>
              <div className="heatmap-legend-stops">
                <span className="legend-stop">
                  <i style={{ background: 'hsl(180, 100%, 45%)' }} /> Baixa
                </span>
                <span className="legend-stop">
                  <i style={{ background: 'hsl(120, 100%, 42%)' }} /> Moderada
                </span>
                <span className="legend-stop">
                  <i style={{ background: 'hsl(50, 100%, 48%)' }} /> Alta
                </span>
                <span className="legend-stop">
                  <i style={{ background: 'hsl(0, 100%, 50%)' }} /> Máxima ({maxClickCount} {maxClickCount === 1 ? 'clique' : 'cliques'})
                </span>
              </div>
            </div>
          )}

          {/* Controles de Escala (Zoom Out) e Informações da Réplica */}
          <div className="heatmap-scroll-hint heatmap-zoom-bar">
            <div className="heatmap-zoom-info">
              <Maximize2 size={15} />
              <span>
                Réplica proporcional da página (<b>{baseWidth}px × {pageHeight}px</b>, {blocks.length} blocos) — exibida em escala{' '}
                <b>{Math.round(activeScale * 100)}%</b> para caber na tela sem precisar rolar para o lado.
              </span>
            </div>

            <div className="heatmap-zoom-controls">
              <button
                type="button"
                className={`zoom-preset-btn ${customScale === null && zoomMode === 'compact' ? 'active' : ''}`}
                onClick={() => {
                  setCustomScale(null)
                  setZoomMode('compact')
                }}
                title="Miniatura ainda menor para ver mais da página de uma vez"
              >
                Miniatura
              </button>
              <button
                type="button"
                className={`zoom-preset-btn ${customScale === null && zoomMode === 'fit' ? 'active' : ''}`}
                onClick={() => {
                  setCustomScale(null)
                  setZoomMode('fit')
                }}
                title="Ajustar automaticamente na tela com zoom out"
              >
                Ajustar à tela
              </button>
              <button
                type="button"
                className={`zoom-preset-btn ${customScale === null && zoomMode === 'actual' ? 'active' : ''}`}
                onClick={() => {
                  setCustomScale(null)
                  setZoomMode('actual')
                }}
                title="Ver em tamanho real 100%"
              >
                100%
              </button>

              <div className="zoom-step-group">
                <button
                  type="button"
                  className="zoom-icon-btn"
                  onClick={() => setCustomScale(Math.max(0.3, Number((activeScale - 0.1).toFixed(2))))}
                  title="Diminuir zoom (Zoom Out)"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="zoom-pct-readout">{Math.round(activeScale * 100)}%</span>
                <button
                  type="button"
                  className="zoom-icon-btn"
                  onClick={() => setCustomScale(Math.min(1, Number((activeScale + 0.1).toFixed(2))))}
                  title="Aumentar zoom (Zoom In)"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Área do Wireframe + Heatmap em Réplica Reduzida (Zoom Out) */}
          <div className="heatmap-canvas-wrapper" ref={wrapperRef}>
            <div
              className="heatmap-scaled-stage"
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`
              }}
            >
              <div
                className={`heatmap-canvas ${device}`}
                style={{
                  width: `${baseWidth}px`,
                  minWidth: `${baseWidth}px`,
                  height: `${pageHeight}px`,
                  minHeight: `${pageHeight}px`,
                  position: 'relative',
                  transform: `scale(${activeScale})`,
                  transformOrigin: 'top left'
                }}
              >
                {/* Wireframe Sintético (Placeholders Estruturais e Ricos) */}
                <div className="wireframe-layer" style={{ height: `${pageHeight}px` }}>
                  {blocks.map((block, idx) => (
                    <RenderWireframeBlock key={idx} block={block} baseWidth={baseWidth} />
                  ))}
                </div>

                {/* Camada 1: Cliques (Pontos térmicos sobrepostos na réplica) */}
                {activeLayer === 'clicks' && (
                  <div className="heatmap-layer-clicks" style={{ height: `${pageHeight}px` }}>
                    {clicks.map((click, i) => {
                      const intensity = Math.min(1, click.count / maxClickCount)
                      const size = Math.round(42 + intensity * 32)
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
                            background: `radial-gradient(circle, hsla(${hue}, 100%, 50%, 0.88) 0%, hsla(${hue}, 100%, 50%, 0.4) 45%, transparent 75%)`
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
          </div>
        </>
      )}
    </div>
  )
}
