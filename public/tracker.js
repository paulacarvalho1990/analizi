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
  const context = () => {
    const referrerUrl = cleanUrl(document.referrer)
    const referrerHost = referrerUrl ? new URL(referrerUrl).hostname.replace(/^www\./, '') : ''
    return {
      trackerSiteId: siteId, visitorId, sessionId, sessionNumber,
      pagePath: location.pathname, pageTitle: truncate(document.title, 512), pageUrl: cleanUrl(location.href),
      pageHostname: location.hostname, referrerHost, referrerUrl, language: navigator.language,
      ...parseUserAgent(), ...attribution(),
    }
  }
  const send = (eventName, metadata = {}) => {
    const elapsed = Math.max(0, now() - lastEventAt)
    lastEventAt = now(); set(session, activityKey, String(lastEventAt))
    const payload = JSON.stringify({ events: [{ id: randomId(), occurredAt: new Date().toISOString(), eventName, engagementTimeMs: elapsed, isConversion: eventName === 'sign_up' || eventName === 'whatsapp_contact', metadata, ...context() }] })
    if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([payload], { type: 'text/plain' }))
    else fetch(endpoint, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: payload, keepalive: true }).catch(() => {})
  }

  if (isNewSession) send('session_start')
  if (isFirstVisit) send('first_visit')
  send('page_view')

  // --- Heatmap Econômico: 1. Extração Estrutural de Layout (Placeholders / Wireframe) ---
  const layoutSentKey = `analizi:${siteId}:layout:${location.pathname}`
  const captureLayout = () => {
    if (get(session, layoutSentKey)) return
    try {
      const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth || 0)
      const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight || 0)
      if (docH <= 0 || docW <= 0) return

      // Seleciona elementos estruturais e blocos visuais chave
      const selectors = 'header, footer, nav, main, section, article, h1, h2, h3, button, a, img, video, form, [role="button"]'
      const nodes = [...document.querySelectorAll(selectors)]
      const blocks = []

      for (const el of nodes) {
        if (!(el instanceof HTMLElement)) continue
        const rect = el.getBoundingClientRect()
        // Ignora elementos invisíveis ou minúsculos
        if (rect.width < 15 || rect.height < 15) continue
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue

        const top = Math.round(rect.top + window.scrollY)
        const left = Math.round(rect.left + window.scrollX)
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)

        let type = el.tagName.toLowerCase()
        if (type === 'a') type = el.querySelector('img') ? 'image-link' : 'link'
        else if (type.startsWith('h')) type = 'heading'
        else if (type === 'button' || el.getAttribute('role') === 'button') type = 'button'
        else if (type === 'img') type = 'image'
        else if (type === 'video') type = 'video'
        else if (type === 'form') type = 'form'
        else if (['header', 'footer', 'nav', 'section', 'article', 'main'].includes(type)) type = 'section'

        const label = truncate(el.getAttribute('aria-label') || el.getAttribute('alt') || el.innerText || el.getAttribute('placeholder') || '', 60)

        blocks.push({
          type,
          top,
          left,
          width,
          height,
          label
        })

        if (blocks.length >= 120) break // Limite seguro para manter payload minúsculo
      }

      const layoutData = {
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        page_height: docH,
        blocks
      }

      send('page_layout', { layout: layoutData })
      set(session, layoutSentKey, '1')
    } catch {}
  }

  if (document.readyState === 'complete') {
    setTimeout(captureLayout, 1500)
  } else {
    window.addEventListener('load', () => setTimeout(captureLayout, 1500))
  }

  // --- Heatmap Econômico: 2. Monitoramento de Scroll Depth (Zero tráfego durante o scroll) ---
  let maxScrollPct = 0
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

  const sendScrollDepth = () => {
    if (maxScrollPct <= 0) return
    const brackets = []
    if (maxScrollPct >= 25) brackets.push('25%')
    if (maxScrollPct >= 50) brackets.push('50%')
    if (maxScrollPct >= 75) brackets.push('75%')
    if (maxScrollPct >= 95) brackets.push('100%')

    send('scroll_depth', {
      max_percentage: maxScrollPct,
      depth_brackets: brackets
    })
    maxScrollPct = 0 // Evita duplo envio
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendScrollDepth()
  })
  window.addEventListener('pagehide', sendScrollDepth)

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
