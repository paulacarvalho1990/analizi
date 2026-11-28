# ADR 0001 — Migração do Supabase para Cloudflare D1

- **Status:** aceita (28/11/2026)
- **Card:** #25 (épico #24)
- **Substitui:** a arquitetura com Supabase (dados do app, login e RLS) + D1 (eventos)

## Contexto

Hoje o Analizi tem duas fontes de verdade:

- **Supabase:** 10 tabelas do app (`profiles`, `businesses`, `business_members`, `business_invitations`, `sites`, `data_sources`, `report_settings`, `insight_views`, `user_consents`, `weekly_reports`), 29 políticas RLS, a função `promote_next_report_kinds` e o login com Google (Supabase Auth).
- **D1 `analizi-events`:** eventos, consolidados diários e mensais, GA4, layouts do heatmap, relatórios semanais e a cópia `tracker_sites`.

A cópia `tracker_sites` é sincronizada pelo front por uma rota pública, e o Worker faz de 2 a 5 chamadas HTTP ao Supabase por requisição para checar acesso. As falhas de segurança corrigidas em #6 e #7 nasceram dessa costura. Só existem 2 perfis em produção, então migrar agora é barato.

## Decisões

### 1. Dois bancos D1

| Banco | Conteúdo |
|---|---|
| `analizi-app` (novo) | usuários, contas Google, sessões, negócios, membros, convites, sites, fontes de dados, assinaturas, configurações de relatório, consentimentos, visualizações de insights, **`ga4_connections`** (tokens criptografados) |
| `analizi-events` (existente) | eventos, consolidados diários/mensais, números importados do GA4, layouts do heatmap, `weekly_site_reports`, `site_insights` |

**Por quê:** cada banco D1 executa uma consulta por vez (leitura ou escrita) e tem limite de 10 GB no plano pago (500 MB no gratuito). Separados, a coleta e as leituras pesadas do painel não disputam a vez com o login e as telas do app, e o crescimento dos eventos não pressiona o limite do banco do app.

`ga4_connections` sai do banco de eventos: é credencial de conta e precisa ficar atrás da camada de autorização. `weekly_reports` do Supabase é descartada (duplica `weekly_site_reports` do D1).

**Consequência:** o D1 não faz `join` entre bancos. Toda consulta que hoje cruza `tracker_sites` com eventos (status do rastreador, `worker.ts:458`, crons, relatório semanal, checagens de acesso — 9 pontos hoje) passa a fazer duas consultas: sites no `analizi-app`, eventos no `analizi-events`.

### 2. Login com Better Auth

- Biblioteca: **Better Auth**, com adaptador D1 e provedor Google (único provedor).
- Não escrever OAuth à mão. Auth.js fica como alternativa se a validação falhar.
- **Validado em 28/11/2026** com o protótipo `poc/better-auth-d1/` (Better Auth 1.7.25, Worker + D1, sem flags de compatibilidade extras). Ver [Resultado da validação](#resultado-da-validação).
- **Instância única por isolate:** criar o Better Auth a cada requisição faz ele reler a estrutura do banco (~13 consultas). Criando uma vez e reaproveitando, só a primeira requisição do isolate paga esse custo.
- **Endereço vem da configuração:** como a instância é reaproveitada, `baseURL` e `trustedOrigins` vêm de uma variável do ambiente (`APP_ORIGIN`), nunca do endereço da requisição. Senão, o primeiro host que chegar ao isolate vira o oficial e o login falha nos outros.
- **Sair só por POST,** com checagem de origem. Logout por GET deixa qualquer site deslogar o usuário com um link.
- A API de sessão nunca devolve o token da sessão.
- **Repassar os cookies do Better Auth:** ao ler a sessão no servidor (`getSession`), usar `returnHeaders: true` e repassar os `Set-Cookie` na resposta. Sem isso o cache do cookie vence e nunca é renovado: toda requisição volta a ler sessão e usuário no D1 (2 consultas). Medido no protótipo.
- Cliente OAuth próprio para o login (`Analizi — Login`), separado do cliente do GA4. Escopos: `openid`, `email`, `profile`.
- IDs de usuário em **UUID** (configurar a geração de ID do Better Auth; o padrão dele não é UUID).

### 3. Sessão

- Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, no domínio do app (definido em #58).
- Validade de 30 dias, renovada a cada dia de uso.
- Cache de sessão no próprio cookie (5 min) para não consultar o D1 em toda requisição.
- Front chama a API no mesmo endereço do app (`/v1/...`), não mais pela URL absoluta do Worker.
- **Requisição forjada (CSRF):** a camada de autorização recusa escritas (`POST`/`PUT`/`PATCH`/`DELETE`) cuja `Origin` não seja a do app. As rotas do Better Auth já fazem essa checagem.

### 4. Coletor e sites ativos

- O coletor (`/v1/collect`, `/v1/events`, `/v1/sync`) lê os sites ativos do `analizi-app`, com cache em memória de 60 s por isolate.
- `tracker_sites` deixa de existir, junto com a rota pública que a sincroniza. Desativar um site leva no máximo 60 s para valer na coleta.

### 5. IDs e mapeamento

- UUIDs mantidos: usuários, negócios e sites levam o **mesmo ID** do Supabase para o D1.
- O identificador do rastreador (`ANLZ…-A`) não muda.
- Para os usuários atuais caírem no mesmo usuário no Better Auth, migrar também o vínculo com a conta Google (`auth.identities` do Supabase → tabela de contas do Better Auth, provedor `google` + `sub`).

### 6. Autorização central

- Toda rota `/v1/*` (exceto coleta e `tracker.js`) passa por uma única camada que resolve sessão → usuário → papel no negócio (`owner`, `admin`, `viewer`) → plano.
- Nenhuma rota consulta dados sem passar por ela. As 29 políticas RLS atuais viram regras dessa camada (#28), com testes (#36).

### 7. Transição

- O login com Google via **Supabase Auth continua até o corte (#41)**; o #27 o substitui.
- No corte, todos entram de novo (sessões do Supabase deixam de valer). Hoje afeta 2 pessoas.

### 8. Ambientes e backup

- Cada ambiente (preview, staging, produção) tem seu par de bancos (#57).
- O Google só aceita URLs de retorno cadastradas: staging e produção entram; **previews de PR não conseguem fazer login** (testar login em staging).
- Backup: Time Travel do D1 (30 dias no plano pago, 7 no gratuito) + exportação periódica (#39).

### 9. Banco por cliente (Rede/Grupo, #22)

Fica para depois. Todas as tabelas do app levam `business_id`, para que um cliente possa ser separado num banco próprio sem reescrever o app.

## Resultado da validação

Protótipo em `poc/better-auth-d1/` (Worker `analizi-auth-poc` + D1 `analizi-auth-poc`, ambos descartáveis), 28/11/2026:

| Verificação | Resultado |
|---|---|
| Better Auth roda no Worker com D1 direto (sem Kysely à parte, sem flags extras) | ✅ |
| Login com Google cria usuário com **UUID** (`generateId: 'uuid'`) | ✅ |
| Conta Google gravada em `account` (`providerId = google`, `accountId` = `sub` do Google) | ✅ — é esse par que a migração (#37) precisa trazer de `auth.identities` |
| Sessão gravada no D1, vence em 30 dias | ✅ |
| Cookie de state do login com `__Secure-`, `HttpOnly`, `Secure`, `SameSite=Lax` (lido no cabeçalho) | ✅ |
| Cookies de sessão invisíveis ao JavaScript (mesma configuração `defaultCookieAttributes`) | ✅ |
| Cache de sessão: **0 consultas** ao D1 enquanto o cache do cookie vale (5 min); depois, 1 leitura, e 1 gravação por dia para renovar a sessão | ✅ (com instância única por isolate) |
| POST de outra origem com cookie é recusado (`403 Invalid origin`) | ✅ |

Pendências levadas ao #27: tabelas do Better Auth no esquema do `analizi-app` (#26), URLs de retorno de staging e produção no cliente `Analizi — Login`, e remover do cliente a URL do protótipo.

## Alternativas descartadas

- **Manter o Supabase e só corrigir as brechas:** mantém duas fontes de verdade e a latência de 2–5 chamadas por requisição.
- **Um único banco D1:** coleta e app disputariam a mesma fila de consultas e o mesmo limite de 10 GB.
- **OAuth escrito à mão:** risco de segurança sem ganho.

## Tarefas por card

| Card | O que este ADR define para ele |
|---|---|
| #26 | Esquema do `analizi-app` (inclui `ga4_connections`, tabelas do Better Auth com UUID) |
| #27 | Better Auth + Google; validar no Worker primeiro; cookie e cache de sessão |
| #28 | Camada central; regras equivalentes às 29 políticas RLS; checagem de `Origin` |
| #29 | API do app no Worker; front no mesmo endereço |
| #31 | Consultas sem `join` entre bancos (9 pontos que leem `tracker_sites`) |
| #34 | Crons lendo sites do `analizi-app`; substituir `promote_next_report_kinds` |
| #37 | Migrar dados mantendo IDs + `auth.identities` → contas Google |
| #39 | Time Travel + exportação |
| #41 | Corte: novo login para todos; remover `tracker_sites` e a rota pública |
| #57 / #58 | Bancos por ambiente; domínio do cookie e URLs de retorno do Google |
