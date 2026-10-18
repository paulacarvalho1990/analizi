# Roadmap do MVP

## Fase 1 — estrutura e experiência

- [x] Base React, TypeScript, Vite e Tailwind.
- [x] Kit visual e navegação mobile-first.
- [x] Jornadas: login, cadastro, negócio, fonte de dados, início, público, páginas, resultados, insights e configurações.
- [x] Contrato de arquitetura e ambiente Supabase.
- [ ] Migrations Supabase, autenticação real e persistência do cadastro de negócio/site.

**Conclusão:** uma pessoa cria conta, entra na aplicação e cadastra seu site com dados persistidos e isolados via RLS.

## Fase 2 — integrações e coleta

- [ ] OAuth GA4 e seleção de propriedade.
- [ ] Script Analizi, Worker de coleta e validação de instalação.
- [ ] Eventos com minimização de dados, deduplicação e agregações.

## Fase 3 — dashboards

- [ ] Consultas de métricas consolidadas, filtros e comparações reais.
- [ ] Páginas, origens e resultados por fonte.

## Fase 4 — insights e relatórios

- [ ] Motor determinístico de regras e e-mail semanal via Resend.

## Fase 5 — comercialização

- [ ] Controle de assinatura, limite de visualizações, observabilidade e revisão de privacidade.
