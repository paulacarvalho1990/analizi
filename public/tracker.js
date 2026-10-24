/* Analizi Tracker v1 — coleta anônima e sem conteúdo de formulários. */
(() => {
  const script = document.currentScript || [...document.scripts].find((item) => item.src.includes('tracker.js'))
  const siteId = script?.dataset.site
  if (!siteId || !/^ANLZ[A-Z0-9]{5}-A$/.test(siteId)) return

  const endpoint = new URL('/v1/events', script.src).toString()
  const now = () => Date.now()
  const storage = (kind) => {
    try { return window[kind] } catch { return null }
  }
  const local = storage('localStorage')
  const session = storage('sessionStorage')
  const get = (store, key) => store?.getItem(key) || ''
  const set = (store, key, value) => { try { store?.setItem(key, value) } catch {} }
  const randomId = () => crypto.randomUUID ? crypto.randomUUID() : `${now()}-${Math.random().toString(36).slice(2)}`
  const visitorKey = `analizi:${siteId}:visitor`
  const sessionKey = `analizi:${siteId}:session`
  const activityKey = `analizi:${siteId}:activity`
  const countKey = `analizi:${siteId}:sessions`
  const attrKey = `analizi:${siteId}:attribution`
  const isFirstVisit = !get(local, visitorKey)
  const visitorId = get(local, visitorKey) || randomId()
  set(local, visitorKey, visitorId)
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

    // Se a sessão já tem atribuição salva e não há novos parâmetros UTM explícitos, mantém a origem da sessão
    const saved = get(session, attrKey)
    if (saved && !utmSource && !utmCampaign) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.source) return parsed
      } catch {}
    }

    let source = utmSource || ''
    let medium = utmMedium || ''
    const campaign = utmCampaign || ''

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

    const attrData = { source, medium, campaign }
    set(session, attrKey, JSON.stringify(attrData))
    return attrData
  }
  let lastEventAt = now()
  let lastTrackedPath = location.pathname
  let lastTrackedTitle = truncate(document.title, 512)
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
    const isVisible = document.visibilityState !== 'hidden'
    const consumeTime = options.consumeTime !== false
    const elapsed = consumeTime ? Math.max(0, now() - lastEventAt) : 0
    if (consumeTime && isVisible) {
      lastEventAt = now()
      set(session, activityKey, String(lastEventAt))
    }
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
      const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth || 0)
      const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight || 0)
      if (docH <= 0 || docW <= 0) return

      // 1. Coleta elementos visuais e ignora contêineres gigantes de estrutura (main/section genérica)
      const selectors = 'header, footer, nav, article, h1, h2, h3, h4, button, a, img, video, form, input:not([type="hidden"]), select, textarea, [role="button"], [role="banner"], .card, .price-card, .metric-card, .chart-card, .table-card, .banner, .landing-hero, .hero-product'
      const rawNodes = [...document.querySelectorAll(selectors)]
      const candidates = []

      const typePriority = {
        button: 10,
        input: 10,
        form: 9,
        video: 8,
        image: 8,
        'image-link': 8,
        link: 7,
        heading: 7,
        card: 5,
        banner: 4,
        header: 3,
        footer: 3,
        section: 1
      }

      for (const el of rawNodes) {
        if (!(el instanceof HTMLElement)) continue
        const rect = el.getBoundingClientRect()
        // Ignora elementos invisíveis, minúsculos ou que cubram quase a página inteira
        if (rect.width < 16 || rect.height < 16) continue
        if (rect.height > docH * 0.7 && rect.height > 900) continue
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue

        const top = Math.round(rect.top + window.scrollY)
        const left = Math.round(rect.left + window.scrollX)
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)

        let type = el.tagName.toLowerCase()
        if (type === 'a') {
          type = el.querySelector('img') ? 'image-link' : (el.classList.contains('button') || el.classList.contains('btn') ? 'button' : 'link')
        } else if (type.startsWith('h') && type.length === 2) {
          type = 'heading'
        } else if (type === 'button' || el.getAttribute('role') === 'button') {
          type = 'button'
        } else if (type === 'img') {
          type = 'image'
        } else if (type === 'video') {
          type = 'video'
        } else if (type === 'form') {
          type = 'form'
        } else if (type === 'input' || type === 'select' || type === 'textarea') {
          type = 'input'
        } else if (el.classList.contains('banner') || el.classList.contains('landing-hero') || el.getAttribute('role') === 'banner') {
          type = 'banner'
        } else if (el.classList.contains('card') || el.classList.contains('price-card') || el.classList.contains('metric-card') || el.classList.contains('chart-card') || el.classList.contains('table-card') || el.classList.contains('hero-product') || type === 'article') {
          type = 'card'
        } else if (['header', 'footer', 'nav'].includes(type)) {
          type = type === 'footer' ? 'footer' : 'header'
        } else {
          type = 'section'
        }

        const cleanLabel = (txt, limit) => truncate(String(txt || '').replace(/\s+/g, ' '), limit)

        let label = ''
        if (['button', 'link', 'heading', 'input', 'image', 'video', 'image-link'].includes(type)) {
          label = cleanLabel(el.getAttribute('aria-label') || el.getAttribute('alt') || el.innerText || el.getAttribute('placeholder') || '', 48)
        } else if (type === 'card' || type === 'banner' || type === 'form') {
          const heading = el.querySelector('h1, h2, h3, h4, b, strong')
          label = cleanLabel(heading ? heading.innerText : (el.getAttribute('aria-label') || ''), 48)
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

      // 2. Descarta contêineres genéricos que já possuem múltiplos filhos capturados dentro deles
      const leafOrDistinct = candidates.filter((cand) => {
        if (['section', 'header', 'footer', 'banner', 'card'].includes(cand.type)) {
          const childrenInside = candidates.filter((other) => other !== cand && cand.el.contains(other.el))
          // Se um contêiner já tem elementos mais específicos dentro dele, descarta o contêiner para não empilhar caixas
          if (childrenInside.length >= 1 && ['section', 'banner', 'header'].includes(cand.type)) {
            return false
          }
          if (childrenInside.length >= 2 && cand.type === 'card') {
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
    const elapsedSinceLast = Math.max(0, now() - lastEventAt)
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

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendScrollDepth()
    } else if (document.visibilityState === 'visible') {
      // Reinicia o relógio quando o usuário volta para a aba, sem somar tempo em segundo plano
      lastEventAt = now()
      set(session, activityKey, String(lastEventAt))
    }
  })
  window.addEventListener('pagehide', () => sendScrollDepth())

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
    const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth || 1)
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
