/* Analizi Tracker v1 — coleta anônima e sem conteúdo de formulários. */
(() => {
  const script = document.currentScript || [...document.scripts].find((item) => item.dataset?.site || /(?:tracker|izi|app-client)\.js/i.test(item.src))
  const siteId = script?.dataset.site
  if (!siteId || !/^ANLZ[A-Z0-9]{5}-A$/.test(siteId)) return

  const endpoint = new URL('/v1/sync', script.src).toString()
  const now = () => Date.now()
  const storage = (kind) => {
    try { return window[kind] } catch { return null }
  }
  const local = storage('localStorage')
  const session = storage('sessionStorage')
  const get = (store, key) => store?.getItem(key) || ''
  const set = (store, key, value) => { try { store?.setItem(key, value) } catch {} }
  const getCookie = (name) => {
    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'))
      return match ? decodeURIComponent(match[2]) : ''
    } catch { return '' }
  }
  const setCookie = (name, value, days = 730) => {
    try {
      const expires = new Date(Date.now() + days * 86400000).toUTCString()
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
    } catch {}
  }

  const randomId = () => crypto.randomUUID ? crypto.randomUUID() : `${now()}-${Math.random().toString(36).slice(2)}`
  const visitorKey = `analizi:${siteId}:visitor`
  const sessionKey = `analizi:${siteId}:session`
  const activityKey = `analizi:${siteId}:activity`
  const countKey = `analizi:${siteId}:sessions`
  const attrKey = `analizi:${siteId}:attribution`
  const cookieVisitorKey = `_anlz_v_${siteId}`

  // Resiliência contra limpeza de storage: checa localStorage E cookie durável de 2 anos
  const storedVisitor = get(local, visitorKey) || getCookie(cookieVisitorKey)
  const isFirstVisit = !storedVisitor
  const visitorId = storedVisitor || randomId()
  set(local, visitorKey, visitorId)
  setCookie(cookieVisitorKey, visitorId, 730)

  const inactive = now() - Number(get(session, activityKey) || 0) > 30 * 60 * 1000
  const isNewSession = !get(session, sessionKey) || inactive
  const sessionId = isNewSession ? randomId() : get(session, sessionKey)
  const sessionNumber = isNewSession ? Number(get(local, countKey) || 0) + 1 : Number(get(local, countKey) || 1)
  set(session, sessionKey, sessionId)
  set(session, activityKey, String(now()))
  if (isNewSession) set(local, countKey, String(sessionNumber))

  const truncate = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : ''
  const cleanUrl = (value) => {
    try { const url = new URL(value); url.search = ''; url.hash = ''; return url.toString() } catch { return '' }
  }
  const parseUserAgent = () => {
    const ua = navigator.userAgent
    const deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop'
    const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /CriOS\//.test(ua) ? 'Chrome' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Outro'
    const operatingSystem = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Outro'
    return { deviceType, browser, operatingSystem }
  }

  const isAuthReferrer = (hostname) => {
    if (!hostname) return false
    return /^(?:accounts\.google\.com|appleid\.apple\.com|login\.microsoftonline\.com|auth0\.com|supabase\.co)$/i.test(hostname) ||
      /(?:auth|login|oauth|accounts)/i.test(hostname)
  }

  const normalizeReferrer = (hostname) => {
    if (!hostname) return null
    const h = hostname.toLowerCase().replace(/^www\./, '').trim()
    if (h === 'l.wl.co' || h === 'wl.co' || h === 'wa.me' || h === 'whatsapp' || /(?:^|\.)whatsapp\.com$/i.test(h)) {
      return { source: 'WhatsApp', medium: 'social' }
    }
    if (h === 'facebook' || h === 'fb.me' || h === 'fb.com' || /(?:^|\.)facebook\.com$/i.test(h)) {
      return { source: 'Facebook', medium: 'social' }
    }
    if (h === 'instagram' || h === 'ig' || h === 'ig.me' || /(?:^|\.)instagram\.com$/i.test(h)) {
      return { source: 'Instagram', medium: 'social' }
    }
    if (h === 'google' || h === 'google-play' || /(?:^|\.)google\.(?:com|com\.br|co\.[a-z]+|[a-z]{2})$/i.test(h)) {
      return { source: 'Google', medium: 'orgânico' }
    }
    if (h === 'tiktok' || /(?:^|\.)tiktok\.com$/i.test(h)) {
      return { source: 'TikTok', medium: 'social' }
    }
    if (h === 'youtube' || h === 'youtu.be' || /(?:^|\.)youtube\.com$/i.test(h)) {
      return { source: 'YouTube', medium: 'social' }
    }
    if (h === 'twitter' || h === 'x' || h === 't.co' || /(?:^|\.)twitter\.com$/i.test(h) || h === 'x.com') {
      return { source: 'X (Twitter)', medium: 'social' }
    }
    if (h === 'linkedin' || h === 'lnkd.in' || /(?:^|\.)linkedin\.com$/i.test(h)) {
      return { source: 'LinkedIn', medium: 'social' }
    }
    if (h === 'pinterest' || h === 'pin.it' || /(?:^|\.)pinterest\.com$/i.test(h)) {
      return { source: 'Pinterest', medium: 'social' }
    }
    if (h === 'telegram' || h === 't.me' || /(?:^|\.)telegram\.(?:org|me)$/i.test(h)) {
      return { source: 'Telegram', medium: 'social' }
    }
    if (h === 'threads' || /(?:^|\.)threads\.net$/i.test(h)) {
      return { source: 'Threads', medium: 'social' }
    }
    if (h === 'mercadolivre' || /(?:^|\.)mercadolivre\.com(?:\.br)?$/i.test(h) || /(?:^|\.)mercadolibre\.com$/i.test(h)) {
      return { source: 'Mercado Livre', medium: 'referência' }
    }
    if (h === 'shopee' || h === 'shp.ee' || /(?:^|\.)shopee\.com(?:\.br)?$/i.test(h)) {
      return { source: 'Shopee', medium: 'referência' }
    }
    if (h === 'bing' || /(?:^|\.)bing\.com$/i.test(h)) {
      return { source: 'Bing', medium: 'orgânico' }
    }
    if (h === 'yahoo' || /(?:^|\.)yahoo\.com(?:\.br)?$/i.test(h)) {
      return { source: 'Yahoo', medium: 'orgânico' }
    }
    if (h === 'duckduckgo' || /(?:^|\.)duckduckgo\.com$/i.test(h)) {
      return { source: 'DuckDuckGo', medium: 'orgânico' }
    }
    if (h === 'kwai' || /(?:^|\.)kwai\.(?:com|app)$/i.test(h)) {
      return { source: 'Kwai', medium: 'social' }
    }
    if (h === 'reddit' || h === 'redd.it' || /(?:^|\.)reddit\.com$/i.test(h)) {
      return { source: 'Reddit', medium: 'social' }
    }
    if (h === 'globo' || /(?:^|\.)globo\.com$/i.test(h)) {
      return { source: 'Globo', medium: 'referência' }
    }
    if (h === 'uol' || /(?:^|\.)uol\.com\.br$/i.test(h)) {
      return { source: 'UOL', medium: 'referência' }
    }
    return null
  }

  const attribution = () => {
    const params = new URLSearchParams(location.search)
    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium')
    const utmCampaign = params.get('utm_campaign')
    const utmContent = params.get('utm_content')
    const utmTerm = params.get('utm_term')

    // Identificadores de auto-tagging de tráfego pago (Google, Meta, TikTok, Microsoft/Bing)
    const gclid = params.get('gclid') || params.get('gbraid') || params.get('wbraid')
    const fbclid = params.get('fbclid')
    const ttclid = params.get('ttclid')
    const msclkid = params.get('msclkid')

    // Se a sessão já tem atribuição salva e não há novos parâmetros explícitos, mantém a origem da sessão
    const saved = get(session, attrKey)
    if (saved && !utmSource && !utmCampaign && !gclid && !fbclid && !ttclid && !msclkid) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.source) return parsed
      } catch {}
    }

    let source = utmSource || ''
    let medium = utmMedium || ''
    let campaign = utmCampaign || ''
    let campaignContent = utmContent || ''
    let campaignTerm = utmTerm || ''

    // Auto-classificação inteligente de Tráfego Pago caso não haja UTM explícita
    if (gclid && !source) {
      source = 'Google Ads'
      medium = medium || 'cpc'
      campaign = campaign || '(google-ads)'
    } else if (fbclid && !source) {
      source = 'Meta Ads'
      medium = medium || 'paid-social'
      campaign = campaign || '(meta-ads)'
    } else if (ttclid && !source) {
      source = 'TikTok Ads'
      medium = medium || 'paid-social'
      campaign = campaign || '(tiktok-ads)'
    } else if (msclkid && !source) {
      source = 'Bing Ads'
      medium = medium || 'cpc'
      campaign = campaign || '(bing-ads)'
    }

    if (!source) {
      if (document.referrer) {
        try {
          const refHost = new URL(document.referrer).hostname.replace(/^www\./, '')
          // Ignora se for o próprio domínio do site ou provedor de autenticação (OAuth callback)
          if (refHost && refHost !== location.hostname.replace(/^www\./, '') && !isAuthReferrer(refHost)) {
            const known = normalizeReferrer(refHost)
            if (known) {
              source = known.source
              medium = medium || known.medium
            } else {
              source = refHost
              medium = medium || 'referência'
            }
          }
        } catch {}
      }
    } else {
      const known = normalizeReferrer(source)
      if (known) {
        source = known.source
        medium = medium || known.medium
      }
    }

    if (!source) {
      source = 'direto'
      medium = medium || 'direto'
    }

    const attrData = { source, medium, campaign, campaignContent, campaignTerm }
    set(session, attrKey, JSON.stringify(attrData))
    return attrData
  }
  let lastEventAt = now()
  let engagedCarryMs = 0
  let isEngagedActive = document.visibilityState !== 'hidden' && (typeof document.hasFocus !== 'function' || document.hasFocus())
  let lastTrackedPath = location.pathname
  let lastTrackedTitle = truncate(document.title, 512)

  const pauseEngagementClock = () => {
    if (isEngagedActive) {
      engagedCarryMs += Math.max(0, now() - lastEventAt)
      isEngagedActive = false
    }
  }

  const resumeEngagementClock = () => {
    if (!isEngagedActive && document.visibilityState !== 'hidden') {
      lastEventAt = now()
      isEngagedActive = true
      set(session, activityKey, String(lastEventAt))
    }
  }

  const consumeEngagementMs = () => {
    const activeDelta = isEngagedActive ? Math.max(0, now() - lastEventAt) : 0
    const total = engagedCarryMs + activeDelta
    engagedCarryMs = 0
    lastEventAt = now()
    if (isEngagedActive) {
      set(session, activityKey, String(lastEventAt))
    }
    return total
  }

  const peekEngagementMs = () => {
    const activeDelta = isEngagedActive ? Math.max(0, now() - lastEventAt) : 0
    return engagedCarryMs + activeDelta
  }

  const context = (overridePath, overrideTitle) => {
    const referrerUrl = cleanUrl(document.referrer)
    const referrerHost = referrerUrl ? new URL(referrerUrl).hostname.replace(/^www\./, '') : ''
    return {
      trackerSiteId: siteId, visitorId, sessionId, sessionNumber,
      pagePath: overridePath || location.pathname,
      pageTitle: overrideTitle !== undefined ? overrideTitle : truncate(document.title, 512),
      pageUrl: cleanUrl(location.href),
      pageHostname: location.hostname, referrerHost, referrerUrl, language: navigator.language,
      ...parseUserAgent(), ...attribution(),
    }
  }
  const send = (eventName, metadata = {}, options = {}) => {
    const consumeTime = options.consumeTime !== false
    const elapsed = consumeTime ? consumeEngagementMs() : 0
    const payload = JSON.stringify({
      events: [{
        id: randomId(),
        occurredAt: new Date().toISOString(),
        eventName,
        engagementTimeMs: elapsed,
        isConversion: eventName === 'sign_up' || eventName === 'whatsapp_contact',
        metadata,
        ...context(options.pagePath, options.pageTitle),
      }]
    })
    if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([payload], { type: 'text/plain' }))
    else fetch(endpoint, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: payload, keepalive: true }).catch(() => {})
  }

  if (isNewSession) send('session_start')
  if (isFirstVisit) send('first_visit')
  send('page_view')

  // --- Heatmap Econômico: 1. Extração Estrutural de Layout (1 vez por sessão por página, no page_view e navegação SPA) ---
  const getLayoutSentKey = (path = location.pathname) => `analizi:${siteId}:layout:${sessionId}:${path}`
  const captureLayout = (targetPath = location.pathname) => {
    // Se a rota mudou entre o agendamento e a execução, usa a rota atual
    const currentPath = location.pathname || targetPath || '/'
    const sentKey = getLayoutSentKey(currentPath)
    if (get(session, sentKey)) return
    try {
      const vpW = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 1280)
      const docW = vpW
      const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight || 0)
      if (docH <= 0 || docW <= 0) return

      // 1. Coleta ampla de elementos visuais (cobrindo ~96%+ de sites modernos: WordPress/Elementor, Shopify, Wix, SaaS, LPs)
      const selectors = [
        'header, footer, nav, article, h1, h2, h3, h4, button, a, img, picture, video, audio, iframe, object, embed, canvas, svg',
        'form, input:not([type="hidden"]), select, textarea, table, details, summary, blockquote, dialog, [role="dialog"], [role="button"], [role="banner"], [role="region"]',
        '.analytics-filters, .heatmap-toolbar, .period, [class*="filter"], [class*="search"]',
        '.chart-card, .recharts-wrapper, [class*="chart"], [class*="graph"]',
        '.table-card, [class*="table"]',
        '.faq, .accordion, .install-accordion, [class*="accordion"], [class*="faq"]',
        '.testimonial, [class*="testimonial"], [class*="review"]',
        '.swiper, .slick-slider, .carousel, [class*="carousel"], [class*="slider"]',
        '.card, .price-card, .metric-card, .contact-card, .insight-feature, .insight-row-ai, .hero-product, [class*="card"], [class*="product"], .elementor-widget-container',
        '.banner, .connection-status, .landing-hero, [class*="hero"], [class*="banner"], [class*="cta"]'
      ].join(', ')
      const rawNodes = [...document.querySelectorAll(selectors)]
      const candidates = []

      const typePriority = {
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
        footer: 3,
        section: 1
      }

      for (const el of rawNodes) {
        if (!(el instanceof Element)) continue
        const rect = el.getBoundingClientRect()
        // Ignora elementos invisíveis, minúsculos ou que cubram quase a página inteira
        if (rect.width < 16 || rect.height < 16) continue
        if (rect.height > docH * 0.75 && rect.height > 1000) continue
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue

        const tag = el.tagName.toLowerCase()
        // Ignora SVGs pequenos de ícones internos (mantém apenas SVGs que sejam logos ou ilustrações >= 42px)
        if (tag === 'svg' && (rect.width < 42 || rect.height < 36 || el.closest('button, a, .wireframe-block, .recharts-wrapper, .chart-card'))) {
          continue
        }

        const top = Math.round(rect.top + window.scrollY)
        const rawLeft = Math.round(rect.left + window.scrollX)
        if (rawLeft >= docW - 12 || rawLeft + rect.width <= 12) continue
        const left = Math.max(0, rawLeft)
        const width = Math.min(Math.round(rect.width), Math.max(24, docW - left))
        const height = Math.round(rect.height)
        const cls = typeof el.className === 'string' ? el.className.toLowerCase() : ''
        const src = (el.getAttribute('src') || el.getAttribute('data-src') || '').toLowerCase()

        let type = tag
        if (tag === 'iframe' || tag === 'object' || tag === 'embed') {
          if (/(?:google\.com\/maps|maps\.google|openstreetmap|waze)/i.test(src)) {
            type = 'map'
          } else {
            // 90%+ dos iframes visíveis em LPs/sites são vídeos (YouTube, Vimeo, Panda, Loom, Wistia, Vurb) ou embeds ricos
            type = 'video'
          }
        } else if (tag === 'video' || /(?:video-player|youtube|vimeo|wistia|panda)/i.test(cls)) {
          type = 'video'
        } else if (tag === 'audio' || /(?:audio-player|podcast)/i.test(cls)) {
          type = 'audio'
        } else if (el.classList.contains('chart-card') || el.classList.contains('recharts-wrapper') || tag === 'canvas' || el.querySelector('.recharts-wrapper, .chart, canvas') || /\b(chart|graph|grafico)\b/i.test(cls)) {
          type = 'chart'
        } else if (el.classList.contains('analytics-filters') || el.classList.contains('heatmap-toolbar') || el.classList.contains('period') || /\b(filter|filters|search-bar|toolbar)\b/i.test(cls)) {
          type = 'filter'
        } else if (el.classList.contains('table-card') || tag === 'table' || /\b(table-card|data-table)\b/i.test(cls)) {
          type = 'table'
        } else if (tag === 'details' || tag === 'summary' || el.classList.contains('install-accordion') || /\b(faq|accordion)\b/i.test(cls)) {
          type = 'faq'
        } else if (tag === 'blockquote' || el.classList.contains('testimonial') || /\b(testimonial|depoimento|review-card)\b/i.test(cls)) {
          type = 'testimonial'
        } else if (/\b(swiper|slick-slider|carousel|slider)\b/i.test(cls)) {
          type = 'carousel'
        } else if (tag === 'a') {
          type = el.querySelector('img, svg') ? 'image-link' : (el.classList.contains('button') || el.classList.contains('btn') || /\bbtn\b/i.test(cls) ? 'button' : 'link')
        } else if (type.startsWith('h') && type.length === 2) {
          type = 'heading'
        } else if (type === 'button' || el.getAttribute('role') === 'button') {
          type = 'button'
        } else if (tag === 'img' || tag === 'picture' || tag === 'svg') {
          type = 'image'
        } else if (tag === 'form') {
          type = 'form'
        } else if (tag === 'input' || tag === 'select' || tag === 'textarea') {
          type = 'input'
        } else if (el.classList.contains('banner') || el.classList.contains('connection-status') || el.classList.contains('landing-hero') || el.getAttribute('role') === 'banner' || /\b(hero|banner|cta-section)\b/i.test(cls)) {
          type = 'banner'
        } else if (el.classList.contains('card') || el.classList.contains('price-card') || el.classList.contains('metric-card') || el.classList.contains('contact-card') || el.classList.contains('insight-feature') || el.classList.contains('insight-row-ai') || el.classList.contains('hero-product') || tag === 'article' || /\b(card|product-card|feature-box)\b/i.test(cls)) {
          type = 'card'
        } else if (['header', 'footer', 'nav'].includes(tag)) {
          type = tag === 'footer' ? 'footer' : 'header'
        } else {
          // Verifica se um bloco genérico tem background-image relevante (comum em WordPress/Elementor/Wix)
          if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.includes('url(') && width >= 60 && height >= 60 && el.children.length <= 2) {
            type = 'image'
          } else {
            type = 'section'
          }
        }

        const cleanLabel = (txt, limit) => truncate(String(txt || '').replace(/\s+/g, ' '), limit)
        const textContent = el instanceof HTMLElement ? el.innerText : (el.textContent || '')

        let label = ''
        if (type === 'chart') {
          const heading = el.querySelector('h1, h2, h3, h4, b, strong')
          label = cleanLabel(heading ? `Gráfico: ${heading.textContent}` : 'Gráfico Matemático / Visualização', 52)
        } else if (type === 'filter') {
          label = cleanLabel(el.getAttribute('aria-label') || 'Filtros de Período, Busca e Controles', 52)
        } else if (type === 'table') {
          const heading = el.querySelector('h1, h2, h3, h4, b, strong')
          label = cleanLabel(heading ? `Tabela: ${heading.textContent}` : 'Tabela de Métricas e Resultados', 52)
        } else if (type === 'video') {
          label = cleanLabel(el.getAttribute('title') || el.getAttribute('aria-label') || (src ? `Vídeo (${src.split('/')[2] || 'Player'})` : 'Vídeo / Player Incorporado'), 52)
        } else if (type === 'map') {
          label = cleanLabel(el.getAttribute('title') || el.getAttribute('aria-label') || 'Mapa Interativo / Localização', 52)
        } else if (type === 'audio') {
          label = cleanLabel(el.getAttribute('title') || el.getAttribute('aria-label') || 'Player de Áudio / Podcast', 52)
        } else if (type === 'faq') {
          const summary = el.querySelector('summary, h3, h4, button, b')
          label = cleanLabel(summary ? `FAQ / Acordeão: ${summary.textContent}` : (textContent || 'Perguntas Frequentes (Acordeão)'), 52)
        } else if (type === 'testimonial') {
          label = cleanLabel(`Depoimento: ${textContent}`, 52)
        } else if (type === 'carousel') {
          label = cleanLabel(el.getAttribute('aria-label') || 'Carrossel / Galeria Interativa', 52)
        } else if (['button', 'link', 'heading', 'input', 'image', 'image-link'].includes(type)) {
          label = cleanLabel(el.getAttribute('aria-label') || el.getAttribute('alt') || textContent || el.getAttribute('placeholder') || '', 48)
        } else if (type === 'card' || type === 'banner' || type === 'form') {
          const heading = el.querySelector('h1, h2, h3, h4, .metric-title, b, strong')
          label = cleanLabel(heading ? heading.textContent : (el.getAttribute('aria-label') || textContent || ''), 48)
        } else {
          label = cleanLabel(el.getAttribute('aria-label') || '', 40)
        }

        candidates.push({
          el,
          type,
          priority: typePriority[type] || 1,
          area: width * height,
          top,
          left,
          width,
          height,
          label
        })
      }

      // 2. Preserva componentes compostos (chart, filter, table, video, map, faq, testimonial, carousel, metric-card) inteiros,
      // descartando os sub-elementos internos deles para não empilhar nem destruir o componente!
      const compositeTypes = ['chart', 'filter', 'table', 'video', 'map', 'audio', 'faq', 'testimonial', 'carousel']
      const composites = candidates.filter((c) => compositeTypes.includes(c.type) || c.el.classList.contains('metric-card'))

      const leafOrDistinct = candidates.filter((cand) => {
        // Se este elemento está dentro de um componente composto já capturado, descarta o filho interno
        const isInsideComposite = composites.some((comp) => comp !== cand && comp.el.contains(cand.el))
        if (isInsideComposite) return false

        if (['section', 'header', 'footer', 'banner', 'card'].includes(cand.type)) {
          const childrenInside = candidates.filter((other) => other !== cand && cand.el.contains(other.el))
          if (childrenInside.length >= 1 && ['section', 'banner', 'header'].includes(cand.type)) {
            return false
          }
          // Mantém cards de métricas e cards normais a menos que sejam wrappers de página inteira com muitos blocos
          if (childrenInside.length > 4 && cand.type === 'card' && !cand.el.classList.contains('metric-card')) {
            return false
          }
        }
        return true
      })

      // 3. Ordena por prioridade visual (botões, títulos, imagens primeiro; menores áreas primeiro)
      leafOrDistinct.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority
        return a.area - b.area
      })

      // 4. Filtro estrito anti-colisão (AABB): nenhum bloco aceito pode sobrepor outro já aceito
      const accepted = []
      const overlaps = (a, b) => {
        const pad = 2
        const xOverlap = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left))
        const yOverlap = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top))
        if (xOverlap <= pad || yOverlap <= pad) return false
        const intersection = xOverlap * yOverlap
        const minArea = Math.min(a.width * a.height, b.width * b.height)
        return intersection / Math.max(1, minArea) > 0.15
      }

      for (const c of leafOrDistinct) {
        const hasCollision = accepted.some((existing) => overlaps(existing, c))
        if (!hasCollision) {
          accepted.push({
            type: c.type,
            top: c.top,
            left: c.left,
            width: c.width,
            height: c.height,
            label: c.label
          })
        }
        if (accepted.length >= 75) break
      }

      if (accepted.length === 0) return

      // Reordena de cima para baixo para leitura limpa
      accepted.sort((a, b) => a.top - b.top || a.left - b.left)

      const layoutData = {
        viewport_width: Math.max(window.innerWidth || 0, docW),
        viewport_height: window.innerHeight,
        page_height: docH,
        blocks: accepted
      }

      send('page_layout', { layout: layoutData }, { consumeTime: false })
      set(session, sentKey, '1')
    } catch {}
  }

  // --- Heatmap Econômico: 2. Monitoramento de Scroll Depth e Tempo de Atenção ---
  let maxScrollPct = 0
  let sentScrollForCurrentPage = false
  const updateScrollDepth = () => {
    try {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0
      const winH = window.innerHeight || 0
      const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight || 1)
      const currentPct = Math.min(100, Math.round(((scrollY + winH) / docH) * 100))
      if (currentPct > maxScrollPct) {
        maxScrollPct = currentPct
      }
    } catch {}
  }

  window.addEventListener('scroll', updateScrollDepth, { passive: true })
  updateScrollDepth()

  const sendScrollDepth = (overridePath, overrideTitle) => {
    const elapsedSinceLast = peekEngagementMs()
    // Envia se houve rolagem nova nesta página OU se há tempo de atenção relevante (>= 1s) a registrar ao sair da página/aba
    if (sentScrollForCurrentPage && elapsedSinceLast < 1000) return
    const brackets = []
    if (!sentScrollForCurrentPage) {
      if (maxScrollPct >= 25) brackets.push('25%')
      if (maxScrollPct >= 50) brackets.push('50%')
      if (maxScrollPct >= 75) brackets.push('75%')
      if (maxScrollPct >= 95) brackets.push('100%')
      sentScrollForCurrentPage = true
    }

    send('scroll_depth', {
      max_percentage: maxScrollPct,
      depth_brackets: brackets
    }, { pagePath: overridePath, pageTitle: overrideTitle })
  }

  // Padrão GA4 (engagement_time_msec): acumula tempo somente com aba visível e janela em foco
  window.addEventListener('blur', () => {
    pauseEngagementClock()
  })
  window.addEventListener('focus', () => {
    resumeEngagementClock()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pauseEngagementClock()
      sendScrollDepth()
    } else if (document.visibilityState === 'visible') {
      resumeEngagementClock()
    }
  })
  window.addEventListener('pagehide', () => {
    pauseEngagementClock()
    sendScrollDepth()
  })

  const schedulePageLayoutCapture = () => {
    const path = location.pathname
    setTimeout(() => captureLayout(path), 800)
    setTimeout(() => captureLayout(path), 2000)
  }

  // Captura o page_layout do page_view inicial (1 vez por sessão por página)
  schedulePageLayoutCapture()
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => schedulePageLayoutCapture())
  }

  // Monitora navegação SPA (History API / popstate) para disparar page_view + page_layout (1x por sessão por página)
  const handleRouteChange = () => {
    const newPath = location.pathname
    if (newPath && newPath !== lastTrackedPath) {
      // Envia o scroll_depth e o tempo de atenção acumulado da página anterior antes de trocar
      sendScrollDepth(lastTrackedPath, lastTrackedTitle)
      lastTrackedPath = newPath
      lastTrackedTitle = truncate(document.title, 512)
      maxScrollPct = 0
      sentScrollForCurrentPage = false
      engagedCarryMs = 0
      lastEventAt = now()
      send('page_view')
      updateScrollDepth()
      schedulePageLayoutCapture()
    }
  }

  window.addEventListener('popstate', handleRouteChange)
  try {
    const origPushState = history.pushState
    const origReplaceState = history.replaceState
    history.pushState = function (...args) {
      const ret = origPushState.apply(this, args)
      handleRouteChange()
      return ret
    }
    history.replaceState = function (...args) {
      const ret = origReplaceState.apply(this, args)
      handleRouteChange()
      return ret
    }
  } catch {}

  // --- Heatmap Econômico: 3. Cliques Estruturais (Sem Loose Clicks) com Coordenadas ---
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a, button, [role="button"], input[type="button"], input[type="submit"], img, video') : null
    if (!target) return
    const href = target instanceof HTMLAnchorElement ? target.href : ''
    const label = truncate(target.getAttribute('aria-label') || target.textContent || target.getAttribute('value') || target.getAttribute('alt') || '', 160)
    const isWhatsapp = /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)
    const isPhone = /^tel:/i.test(href)
    const isEmail = /^mailto:/i.test(href)
    const isSignup = /\b(cadastre-se|inscreva-se|criar\s*(minha\s*)?conta|come[cç]ar\s*agora|teste\s*(gr[aá]tis)?)\b/i.test(label)
    const isLogin = /\b(entrar|acessar\s*(minha\s*)?conta|fazer\s*login|login)\b/i.test(label)
    const hasLeadIntent = /\b(fale\s*(com|conosco)|entre\s*em\s*contato|contato|whats(?:app)?|agend[ea]|marc[ae]\s*(uma\s*)?(consulta|reuni[aã]o)|solicite|pedir|pe[cç]a\s*(um\s*)?or[cç]amento|or[cç]amento|quero\s*(saber|agendar|falar|receber)|ligue|telefone|enviar\s*(mensagem|formul[aá]rio)|tirar\s*d[uú]vidas|falar\s*com\s*(um\s*)?(especialista|consultor)|come[cç]ar\s*agora|teste\s*(gr[aá]tis)?|cadastre-se|inscreva-se)\b/i.test(label)
    const isContactLead = isWhatsapp || isPhone || isEmail || hasLeadIntent
    const isMedia = target.tagName === 'IMG' || target.tagName === 'VIDEO'
    const eventName = isWhatsapp ? 'whatsapp_contact' : isSignup ? 'sign_up' : isLogin ? 'login' : isMedia ? 'media_click' : 'button_click'
    const intent = isWhatsapp ? 'whatsapp' : isPhone ? 'telefone' : isEmail ? 'email' : isSignup ? 'cadastro' : isLogin ? 'login' : hasLeadIntent ? 'contato' : 'geral'

    // Coordenadas para o Heatmap
    const rect = target.getBoundingClientRect()
    const clickX = event.clientX
    const clickY = event.clientY + window.scrollY
    const docW = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 1)
    const clickXPct = Math.min(100, Math.max(0, Math.round((clickX / docW) * 100)))
    const targetTag = target.tagName.toUpperCase()

    send(eventName, {
      button_label: label || (isMedia ? `Mídia (${targetTag.toLowerCase()})` : 'Elemento sem texto'),
      button_id: truncate(target.id, 120),
      destination: cleanUrl(href),
      contact_intent: intent,
      is_contact_lead: isContactLead ? 1 : 0,
      click_x_pct: clickXPct,
      click_y_px: Math.round(clickY),
      target_tag: targetTag
    })
  }, { capture: true })
})()
