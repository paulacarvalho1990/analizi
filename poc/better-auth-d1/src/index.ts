// Protótipo do card #25: Better Auth + Google + D1 num Worker.
// Responde: roda no Worker? cria usuário com UUID? grava sessão no D1? o cache de sessão evita ler o D1?
import { betterAuth } from 'better-auth'

interface Env {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  GOOGLE_OAUTH_CLIENT_ID: string
  GOOGLE_OAUTH_CLIENT_SECRET: string
  APP_ORIGIN: string
}

// Conta quantas consultas cada requisição faz ao D1.
function countingD1(db: D1Database) {
  const counter = { queries: 0, sql: [] as string[] }
  const wrapped = new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === 'prepare') return (sql: string) => { counter.queries++; counter.sql.push(sql.slice(0, 120)); return target.prepare(sql) }
      // prepare() já registra cada SQL; batch só executa os statements preparados.
      if (prop === 'batch') return (stmts: D1PreparedStatement[]) => target.batch(stmts)
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    }
  })
  return { db: wrapped, counter }
}

// Endereço e origens vêm da configuração do ambiente, nunca da requisição:
// a instância é reaproveitada pelo isolate e serviria qualquer host que chegasse primeiro.
function createAuth(env: Env, db: D1Database) {
  const origin = env.APP_ORIGIN
  return betterAuth({
    baseURL: origin,
    secret: env.BETTER_AUTH_SECRET,
    database: db,
    socialProviders: {
      google: { clientId: env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET, prompt: 'select_account' }
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 dias
      updateAge: 60 * 60 * 24, // renova a cada dia de uso
      cookieCache: { enabled: true, maxAge: 5 * 60 } // 5 min sem ler o D1
    },
    advanced: {
      database: { generateId: 'uuid' },
      useSecureCookies: true,
      defaultCookieAttributes: { httpOnly: true, secure: true, sameSite: 'lax' }
    },
    trustedOrigins: [origin]
  })
}

let cached: { auth: ReturnType<typeof createAuth>, counter: { queries: number, sql: string[] } } | null = null

const html = (body: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Analizi auth POC</title><body style="font-family:system-ui;max-width:640px;margin:40px auto;padding:0 16px">${body}</body>`, { headers: { 'content-type': 'text/html; charset=utf-8' } })

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Uma instância por isolate: criar a cada requisição relê a estrutura do banco (~13 consultas).
    const { db, counter } = countingD1(env.DB)
    if (!cached) cached = { auth: createAuth(env, db), counter }
    cached.counter.queries = 0
    cached.counter.sql = []
    const auth = cached.auth
    const counterRef = cached.counter

    if (url.pathname.startsWith('/api/auth/')) return auth.handler(request)

    if (url.pathname === '/entrar') {
      const res = await auth.api.signInSocial({ body: { provider: 'google', callbackURL: '/me' }, asResponse: true })
      const { url: redirect } = await res.clone().json() as { url: string }
      const headers = new Headers({ location: redirect })
      res.headers.forEach((v, k) => { if (k.toLowerCase() === 'set-cookie') headers.append('set-cookie', v) })
      return new Response(null, { status: 302, headers })
    }

    if (url.pathname === '/me') {
      // returnHeaders: o Better Auth devolve o cookie de cache renovado; sem repassá-lo, o cache vence e nunca volta.
      const { headers: authHeaders, response: session } = await auth.api.getSession({ headers: request.headers, returnHeaders: true })
      const withCookies = (res: Response) => { authHeaders.forEach((v, k) => { if (k.toLowerCase() === 'set-cookie') res.headers.append('set-cookie', v) }); return res }
      // Nunca devolve o token da sessão.
      const safeSession = session && { user: session.user, session: { id: session.session.id, userId: session.session.userId, expiresAt: session.session.expiresAt, createdAt: session.session.createdAt, updatedAt: session.session.updatedAt } }
      const payload = { d1Queries: counterRef.queries, sql: counterRef.sql, session: safeSession }
      console.log(JSON.stringify({ route: '/me', d1Queries: counterRef.queries, logged: Boolean(session) }))
      if (url.searchParams.has('json')) return withCookies(Response.json(payload))
      return withCookies(html(session
        ? `<h1>Logada</h1><p>Consultas ao D1 nesta requisição: <b>${counterRef.queries}</b></p><pre>${JSON.stringify(payload, null, 2).replace(/</g, '&lt;')}</pre><p><a href="/me">Recarregar</a></p><form method="post" action="/sair"><button>Sair</button></form><p></p>`
        : `<h1>Sem sessão</h1><p><a href="/">Voltar</a></p>`))
    }

    if (url.pathname === '/sair') {
      // Só POST: um link ou imagem de outro site não consegue deslogar o usuário.
      if (request.method !== 'POST') return new Response('Use POST.', { status: 405, headers: { allow: 'POST' } })
      if (request.headers.get('origin') !== env.APP_ORIGIN) return new Response('Origem inválida.', { status: 403 })
      const res = await auth.api.signOut({ headers: request.headers, asResponse: true })
      const headers = new Headers({ location: '/' })
      res.headers.forEach((v, k) => { if (k.toLowerCase() === 'set-cookie') headers.append('set-cookie', v) })
      return new Response(null, { status: 302, headers })
    }

    return html('<h1>Protótipo de login — Analizi</h1><p><a href="/entrar">Entrar com Google</a></p><p><a href="/me">Ver sessão</a></p>')
  }
}
