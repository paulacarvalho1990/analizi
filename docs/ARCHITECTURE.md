# Arquitetura — Analizi

> Decisão vigente: [ADR 0001 — Migração do Supabase para Cloudflare D1](adr/0001-migracao-supabase-d1.md).
> Esta página descreve o **estado atual** e o **estado-alvo** (após o épico #24).

## Estado atual (até o corte, #41)

```
Navegador (React/Vite) ──► Supabase (login Google, 10 tabelas do app, RLS)
        │
        └──► Cloudflare Worker (/v1/*, assets) ──► D1 analizi-events (eventos, consolidados, GA4, tracker_sites)
                     └──► Supabase REST (checagem de acesso: 2–5 chamadas por requisição)
```

- O front fala direto com o Supabase (`supabase-js`) para dados do app.
- O Worker valida o token no Supabase Auth e checa acesso via REST antes das rotas protegidas (#6, #7).
- `tracker_sites` no D1 é uma cópia dos sites do Supabase, sincronizada pelo front.

## Estado-alvo

```
Navegador (React/Vite) ──► Cloudflare Worker (mesmo domínio)
                              ├─ Better Auth (Google) ─► D1 analizi-app
                              ├─ camada de autorização ─► D1 analizi-app
                              ├─ API do app /v1/*      ─► D1 analizi-app
                              ├─ relatórios/analytics  ─► D1 analizi-events (+ sites do analizi-app)
                              └─ coletor /v1/collect   ─► D1 analizi-events (sites ativos do analizi-app, cache 60 s)
```

- **Um banco do app** (`analizi-app`) e **um banco de eventos** (`analizi-events`), sem sincronização entre eles. Consultas que precisam dos dois fazem duas leituras (o D1 não faz `join` entre bancos).
- **Sessão** em cookie `HttpOnly`/`Secure`/`SameSite=Lax`, 30 dias, renovada a cada dia de uso.
- **Autorização** numa camada única do Worker: sessão → papel no negócio → plano. Escritas de outra origem são recusadas.
- **IDs:** UUID para usuários, negócios e sites (os mesmos do Supabase); `ANLZ…-A` para o rastreador.

## Organização do código

- `src/components`: componentes de interface.
- `src/lib`: clientes e contexto (hoje `supabase.ts`; no estado-alvo, cliente da API do Worker).
- `src/worker.ts`: Worker (rotas `/v1/*`, coletor, crons). A divisão em módulos é o #16.
- `cloudflare/d1/migrations`: migrações do `analizi-events` (e, a partir do #26, do `analizi-app`).
- `supabase/migrations`: esquema atual do Supabase, até o corte.

## Contratos de fontes

Cada fonte (GA4 ou rastreador próprio) produz o mesmo contrato lógico de indicadores: período, sessões, visitantes, visualizações, engajamento, origens, cliques de contato e conversões. A fonte e a metodologia ficam registradas junto do indicador; métricas de fontes distintas não são somadas.

## Privacidade por padrão

O coletor nunca recebe conteúdo de campos de formulários, senhas, e-mails ou telefones. Limitação de taxa, validação de origem e deduplicação de eventos estão nos cards #60–#62; rastreador sem cookies no #82.
