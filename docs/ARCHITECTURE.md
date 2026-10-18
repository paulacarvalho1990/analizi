# Arquitetura inicial — Analizi

O MVP começa pela experiência e pelos contratos que permitem evoluir sem reescrever a interface.

## Organização

- `src/components`: componentes de interface reutilizáveis; componentes `ui` seguem as convenções do shadcn/ui.
- `src/lib`: integrações de infraestrutura. O cliente Supabase só é criado quando as variáveis de ambiente estiverem configuradas.
- `src/App.tsx`: protótipo navegável das jornadas prioritárias. Rotas e dados remotos serão extraídos antes da primeira integração de produção.
- `supabase/`: reservado para migrations, políticas RLS e Edge Functions na Fase 1/2.

## Modelo inicial de dados (a implementar via migrations)

`profiles` → `businesses` → `sites` → `analytics_connections`.

Os indicadores consolidados serão gravados em `daily_metrics`; eventos brutos, com retenção de 90 dias, em `analytics_events`. Toda tabela de domínio terá `business_id`; as políticas RLS devem validar a associação do usuário à organização antes de qualquer leitura ou gravação.

## Contratos de futuras fontes

Cada fonte (GA4 ou rastreador próprio) deve produzir o mesmo contrato lógico para indicadores: período, sessões, visitantes, visualizações, engajamento, origens, cliques de contato e formulários confirmados. A fonte e a metodologia ficam registradas junto do indicador; métricas de fontes distintas não serão somadas.

## Privacidade por padrão

O coletor nunca deve receber conteúdo de campos de formulários, senhas, e-mails ou telefones. O endpoint precisa de limitação de taxa, validação da origem e deduplicação de eventos. Estes controles pertencem à Fase 2, não a este protótipo visual.
