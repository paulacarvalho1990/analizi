# ANALIZI — Ordem de execução

Cards no [GitHub Project ANALIZI](https://github.com/users/paulacarvalho1990/projects/2). Marque `[x]` ao concluir e mova o card para Done.

> **Tudo aqui é pré-lançamento.** O lançamento só acontece depois que todos os cards estiverem concluídos.

## Fase 0 — Correção rápida de segurança (começar aqui)
- [ ] #6 Exigir autenticação em /v1/analytics, /v1/heatmap e /v1/tracker-sites/:id/status
- [ ] #7 Proteger /v1/tracker-sites (GET lista todos, POST aceita plan=admin)
- [ ] #53 Alinhar teste grátis em 7 dias (banco hoje dá 30)
- [ ] #25 [D1] Definir arquitetura da migração e registrar a decisão

## Fase 1 — Refatoração (prepara a migração)
- [ ] #16 Refatorar App.tsx e worker.ts em módulos + atualizar MVP-ROADMAP (só mover código, sem mudar comportamento)

## Fase 2 — Migração Supabase → D1 (#24)
- [ ] #26 Criar banco analizi-app e esquema SQLite
- [ ] #27 Login com Google no Worker (sessão própria)
- [ ] #28 Camada central de autorização (papéis e planos)
- [ ] #29 API do app no Worker para substituir o supabase-js
- [ ] #30 Convites de equipe seguros
- [ ] #31 Proteger leituras: analytics, heatmap, status, relatórios, GA4 e IA
- [ ] #32 Front: trocar Supabase pelo cliente da API e pela sessão
- [ ] #34 Crons e jobs sem Supabase
- [ ] #36 Testes de autorização e do fluxo de login
- [ ] #15 Testes automatizados mínimos (junto com #36, já sobre o D1)
- [ ] #37 Script de migração dos dados
- [ ] #39 Backup e restauração do banco
- [ ] #41 Corte para produção e desligamento do Supabase

## Fase 3 — Cobrança (#38)
- [ ] #48 Escolher o provedor de pagamento
- [ ] #49 Checkout por plano (planos #19–#22)
- [ ] #50 Webhook que atualiza a assinatura
- [ ] #51 Portal do cliente: trocar plano e cancelar
- [ ] #52 Bloquear acesso quando a assinatura vence

## Fase 4 — E-mail (#9)
- [ ] #42 Migrar envio do Resend para o Cloudflare Email Service e ativar o domínio
- [ ] #43 Aplicar migrações do envio semanal
- [ ] #45 Deploy do envio semanal e conferir logs do cron
- [ ] #44 Testar o relatório semanal nos clientes de e-mail
- [ ] #46 Opção para desligar o e-mail semanal em /relatorios
- [ ] #47 E-mails de fim de trial e recuperação de assinatura
- [ ] #56 E-mail de convite de equipe

## Fase 5 — Ambientes, coletor, LGPD, GA4 e observabilidade
- [ ] Ambientes: #57 Bancos D1 de produção · #58 Domínio próprio · #59 Deploy por ambiente
- [ ] Coletor: #60 Rate limit · #61 Deduplicar eventos · #62 Sem cabeçalho Origin · #63 Limite mensal por plano
- [ ] LGPD: #82 Rastreador sem cookies · #64 Termos · #65 Privacidade · #66 Exclusão de conta · #67 DPO · #68 Aviso do rastreador
- [ ] GA4: #69 · #70 Flag por ambiente · #71 Teste em staging · #72 Estados de erro · #14 Verificação OAuth Google
- [ ] #13 Observabilidade: erros e alertas de crons

## Fase 6 — Admin, funil, interface e diferenciais
- [ ] #17 Painel admin interno
- [ ] #18 Analytics do próprio funil
- [ ] UI: #73 · #74 Menu do perfil · #75 Botões sem ação
- [ ] Negócio: #76 · #77 WhatsApp · #78 Benchmark · #79 Metas e alertas · #80 Agências · #81 Search Console · #83 Indicação

## Lançamento
- [ ] Todos os cards acima concluídos
