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
  const attribution = () => {
    const params = new URLSearchParams(location.search)
    const referrer = document.referrer ? new URL(document.referrer) : null
    const source = params.get('utm_source') || (referrer ? referrer.hostname.replace(/^www\./, '') : 'direto')
    const medium = params.get('utm_medium') || (referrer ? 'referência' : 'direto')
    return { source, medium, campaign: params.get('utm_campaign') || '' }
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

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a, button, [role="button"], input[type="button"], input[type="submit"]') : null
    if (!target) return
    const href = target instanceof HTMLAnchorElement ? target.href : ''
    const label = truncate(target.getAttribute('aria-label') || target.textContent || target.getAttribute('value') || '', 160)
    const isWhatsapp = /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)
    const isPhone = /^tel:/i.test(href)
    const isEmail = /^mailto:/i.test(href)
    const isSignup = /\b(cadastre-se|inscreva-se|criar\s*(minha\s*)?conta|come[cç]ar\s*agora|teste\s*(gr[aá]tis)?)\b/i.test(label)
    const isLogin = /\b(entrar|acessar\s*(minha\s*)?conta|fazer\s*login|login)\b/i.test(label)
    const hasLeadIntent = /\b(fale\s*(com|conosco)|entre\s*em\s*contato|contato|whats(?:app)?|agend[ea]|marc[ae]\s*(uma\s*)?(consulta|reuni[aã]o)|solicite|pedir|pe[cç]a\s*(um\s*)?or[cç]amento|or[cç]amento|quero\s*(saber|agendar|falar|receber)|ligue|telefone|enviar\s*(mensagem|formul[aá]rio)|tirar\s*d[uú]vidas|falar\s*com\s*(um\s*)?(especialista|consultor)|come[cç]ar\s*agora|teste\s*(gr[aá]tis)?|cadastre-se|inscreva-se)\b/i.test(label)
    if (!isWhatsapp && !isPhone && !isEmail && !hasLeadIntent) return
    const eventName = isWhatsapp ? 'whatsapp_contact' : isSignup ? 'sign_up' : isLogin ? 'login' : 'button_click'
    const intent = isWhatsapp ? 'whatsapp' : isPhone ? 'telefone' : isEmail ? 'email' : isSignup ? 'cadastro' : isLogin ? 'login' : 'contato'
    send(eventName, { button_label: label || 'Botão de contato', button_id: truncate(target.id, 120), destination: cleanUrl(href), contact_intent: intent })
  }, { capture: true })
})()
