# Fase 1 — Diagnóstico e contrato de dados do GA4

## Status

Concluída em nível de análise do código atual. Nenhuma alteração de comportamento foi feita nesta fase.

## 1. Fluxo atual

O frontend decide a fonte ativa em `src/App.tsx`, dentro de `useAnalytics()`:

1. carrega o site atual e a fonte configurada;
2. monta período e filtros;
3. obtém a sessão do Supabase;
4. chama `/v1/ga4/analytics` para sites GA4;
5. salva o payload inteiro em memória do componente.

O efeito é executado na montagem da tela e novamente quando `filter` ou `currentSite` mudam. As telas que usam esse hook são `Dashboard`, `Acquisition`, `Audience`, `Results`, `Insights` e `Pages`.

## 2. Relatórios atuais

O endpoint `ga4Analytics()` em `src/worker.ts` executa nove `ga4Report()` em paralelo:

1. diário do período atual;
2. diário do período anterior;
3. fonte, mídia e campanha;
4. página;
5. fonte e landing page;
6. dispositivo e navegador;
7. país, região e cidade;
8. eventos de conversão;
9. detalhes de cliques e eventos.

Cada abertura ou alteração de filtro pode repetir a sequência completa. A resposta usa `Cache-Control: no-store` e o resultado não é persistido no D1.

## 3. Contrato de saída atual

O frontend espera o tipo `AnalyticsData`, que contém:

- totais atuais e anteriores;
- série diária;
- fontes;
- páginas;
- origem por landing page;
- dispositivos;
- localizações;
- resultados por fonte/mídia/campanha;
- conversões;
- contatos;
- cliques;
- listas para filtros;
- período e identificação da fonte.

O contrato de saída deve ser preservado na migração. As tabelas persistidas podem ter estrutura diferente, desde que o Worker faça a mesma transformação.

## 4. Matriz de dados necessária

### Métricas gerais

- Dimensão: `date`.
- Métricas: `screenPageViews`, `activeUsers`, `newUsers`, `sessions`, `keyEvents`, `averageSessionDuration`.
- Consumidores: totais, comparação e série diária.

### Fontes e campanhas

- Dimensões: `sessionSource`, `sessionMedium`, `sessionCampaignName`.
- Métricas: visualizações, usuários, novos usuários, sessões e eventos-chave.
- Consumidores: aquisição, resultados e filtros.

### Páginas

- Dimensão: `pagePathPlusQueryString`.
- Métricas: visualizações, usuários, eventos-chave, duração e `bounceRate`.
- Consumidores: páginas, visão geral e filtros.

### Landing pages

- Dimensões: `sessionSource`, `landingPage`.
- Métricas: sessões e usuários.
- Consumidores: aquisição.

### Dispositivos

- Dimensões: `deviceCategory`, `browser`.
- Métricas: visualizações, usuários, novos usuários, sessões e eventos-chave.
- Consumidores: público e filtros.

### Localização

- Dimensões: `country`, `region`, `city`.
- Métricas: visualizações, usuários, novos usuários, sessões e eventos-chave.
- Consumidores: público.

### Eventos e cliques

- Conversões: `date`, `eventName`, `pagePathPlusQueryString`.
- Cliques: `date`, `eventName`, `pagePathPlusQueryString`, `linkText`, `linkId`, `linkUrl`.
- Métricas: `keyEvents`, `eventCount` e `sessions`.
- Consumidores: resultados, contatos e detalhes de cliques.

## 5. Retenção atual e alvo

### Atual

- Eventos brutos do rastreador: limpeza aproximada de 30 dias.
- Consolidados `daily_*`: sem limpeza configurada.
- Rastreador: consultas limitadas a 730 dias.
- Cron diário: `0 3 * * *` UTC, equivalente a 00:00 em São Paulo.

### Alvo

- Diário: 6 meses.
- Mensal: do 7º ao 27º mês.
- Acima de 27 meses: removido.
- GA4 e rastreador: mesma política.

## 6. Contrato de sincronização definido

- O cron é o único consumidor da API do GA4.
- O painel nunca chama a API diretamente após a migração.
- Cada sincronização processa D-1, D-2 e D-3.
- Cada linha persistida deve ser atualizada por `upsert`.
- O reprocessamento deve substituir valores anteriores, nunca somar novamente.
- A data máxima exibida é D-1.
- Novas conexões precisam de backfill separado de até 6 meses.

## 7. Pontos que precisam de validação na Fase 2

- Quais métricas podem ser adicionadas a cada família sem incompatibilidade.
- Se os relatórios de conversão e cliques podem ser combinados.
- Se é melhor consultar D-3 até D-1 em uma chamada com dimensão `date` ou fazer chamadas separadas.
- Quantas linhas cada combinação retorna.
- Consumo real de tokens e concorrência por propriedade.
- Necessidade de paginação em relatórios de alta cardinalidade.

## 8. Critério de saída da Fase 1

A Fase 1 está concluída quando existe uma matriz clara entre relatórios, dimensões, métricas e consumidores, com contrato de saída preservado e regras de retenção/sincronização definidas. A implementação dos report builders e a medição da quota pertencem à Fase 2.
