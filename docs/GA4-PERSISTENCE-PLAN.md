# Plano de persistência e sincronização do GA4

## Objetivo

Fazer com que as telas do Analizi leiam os dados do GA4 a partir do D1, mantendo a API do Google fora do caminho de leitura do painel.

O cron será o único caminho de consulta ao GA4. Os dados serão persistidos como consolidados diários e mensais, com reprocessamento controlado dos dias recentes.

## Política de dados

- Dados disponíveis no painel até D-1.
- Dados diários mantidos por 6 meses.
- Dados mensais mantidos do 7º ao 27º mês.
- Dados anteriores a 27 meses removidos.
- Períodos de até 6 meses podem usar granularidade diária.
- Períodos acima de 6 meses só podem usar granularidade mensal.
- Períodos que atravessam os dois blocos retornam análise mensal.
- GA4: importar e reprocessar D-1, D-2 e D-3 com `upsert`.
- Rastreador e GA4 seguem a mesma política de retenção.

## Estado atual identificado

### Leitura do GA4

O hook `useAnalytics()` em `src/App.tsx` chama `/v1/ga4/analytics` quando a tela é montada ou quando o período/filtro muda. O endpoint atual está em `src/worker.ts`.

Uma chamada ao endpoint executa nove `runReport` em paralelo:

1. métricas diárias do período atual;
2. métricas diárias do período anterior;
3. fontes, mídias e campanhas;
4. páginas;
5. origem e landing page;
6. dispositivos e navegadores;
7. localização;
8. conversões por evento;
9. detalhes de eventos e cliques.

O endpoint retorna `Cache-Control: no-store` e não existe persistência dos resultados do GA4 no D1. Portanto, as telas podem repetir as mesmas consultas ao abrir, navegar ou alterar filtros.

### Retenção atual

- Eventos brutos do rastreador: limpeza após aproximadamente 30 dias, desde que exista consolidação correspondente.
- Tabelas consolidadas `daily_*`: não possuem limpeza de retenção atualmente.
- Limite de consulta do rastreador: 730 dias.
- Cron diário atual: `0 3 * * *` em UTC, equivalente a 00:00 no horário de São Paulo.

## Fase 1 — Diagnóstico e contrato de dados

### Objetivo

Documentar com precisão quais dados o painel precisa, quais relatórios podem ser combinados e qual será o contrato entre o importador GA4, o D1 e o frontend.

Esta fase não muda o comportamento da aplicação nem desativa as consultas atuais ao GA4.

### Inventário atual de consumidores

O hook `useAnalytics()` é usado atualmente por:

- `Dashboard`;
- `Acquisition`;
- `Audience`;
- `Results`;
- `Insights`;
- `Pages`.

O payload compartilhado precisa continuar atendendo essas telas sem que cada tela conheça a origem dos dados.

### Contrato lógico do payload

O backend deve continuar retornando, no mínimo:

- `totals`;
- `previousTotals`;
- `daily`;
- `sources`;
- `pages`;
- `sourcePages`;
- `sourceMediumResults`;
- `devices`;
- `locations`;
- `contactDetails`;
- `clickDetails`;
- `conversionEvents`;
- listas de filtros;
- `periodDays`;
- `sourceKind`.

As tabelas persistidas não precisam reproduzir esse payload. O Worker continuará responsável por agregá-las no formato consumido pelo frontend.

### Matriz inicial de famílias de relatório

#### 1. Métricas diárias gerais

Dimensão principal:

- `date`

Métricas atuais:

- `screenPageViews`;
- `activeUsers`;
- `newUsers`;
- `sessions`;
- `keyEvents`;
- `averageSessionDuration`.

Uso: `daily`, `totals` e `previousTotals`.

O relatório atual do período e o relatório do período anterior deverão ser substituídos por uma consulta que cubra a janela necessária e permita separar os dias no Worker.

#### 2. Fontes, mídias e campanhas

Dimensões:

- `sessionSource`;
- `sessionMedium`;
- `sessionCampaignName`.

Métricas atuais: sessões, usuários, novos usuários, visualizações e eventos-chave.

Uso: `sources`, `sourceMediumResults` e filtros de origem, mídia e campanha.

#### 3. Páginas

Dimensão:

- `pagePathPlusQueryString`.

Métricas atuais:

- `screenPageViews`;
- `activeUsers`;
- `keyEvents`;
- `averageSessionDuration`;
- `bounceRate`.

Uso: `pages` e filtro de páginas.

#### 4. Origem e landing page

Dimensões:

- `sessionSource`;
- `landingPage`.

Métricas:

- `sessions`;
- `activeUsers`.

Uso: `sourcePages`.

#### 5. Dispositivo e navegador

Dimensões:

- `deviceCategory`;
- `browser`.

Métricas:

- `screenPageViews`;
- `activeUsers`;
- `newUsers`;
- `sessions`;
- `keyEvents`.

Uso: `devices` e filtros de dispositivo/navegador.

#### 6. Localização

Dimensões:

- `country`;
- `region`;
- `city`.

Métricas:

- `screenPageViews`;
- `activeUsers`;
- `newUsers`;
- `sessions`;
- `keyEvents`.

Uso: `locations`.

#### 7. Eventos, conversões e cliques

Relatórios atuais:

- `date + eventName + pagePathPlusQueryString`;
- `date + eventName + pagePathPlusQueryString + linkText + linkId + linkUrl`.

Esta família será testada para verificar se pode ser consolidada em um relatório sem provocar explosão de cardinalidade. Se a combinação gerar muitas linhas ou custo maior, os dois relatórios permanecerão separados.

### Regras de compatibilidade e medição

Antes de consolidar relatórios, cada combinação deverá ser validada com o mecanismo de compatibilidade do GA4.

Durante os testes, cada consulta deverá registrar:

- quantidade de relatórios;
- quantidade de linhas retornadas;
- duração;
- status HTTP;
- erro de compatibilidade;
- quota/token retornado pela API, quando disponível;
- volume de dados persistido.

O critério de escolha será o menor consumo real de quota, e não apenas o menor número de requisições HTTP.

### Decisões da Fase 1

- Persistir GA4 em tabelas próprias, sem misturar diretamente com `daily_*` do rastreador.
- Manter o payload atual como contrato de saída do backend.
- Usar `upsert` por site, data e combinação de dimensões.
- Reprocessar D-1, D-2 e D-3.
- Não permitir leitura direta da API nas telas após a conclusão da migração.
- Criar carga inicial controlada para histórico de até 6 meses.
- Gerar consolidados mensais antes de remover dados diários antigos.

### Entregáveis da Fase 1

- este documento com o plano geral;
- inventário dos consumidores do payload;
- matriz inicial de relatórios;
- contrato lógico de saída;
- política de retenção;
- critérios de medição de quota;
- lista de pontos que precisam de validação experimental.

## Fase 2 — Otimização dos relatórios

- Implementar os report builders por família.
- Validar dimensões e métricas compatíveis.
- Testar consulta contínua D-3 até D-1 com dimensão `date`.
- Avaliar a fusão dos relatórios de eventos e cliques.
- Medir linhas, tokens e duração.
- Fixar a versão de menor custo que preserve os dados do painel.

## Fase 3 — Persistência diária

- Criar migrações das tabelas `ga4_daily_*`.
- Criar tabela de controle de sincronização.
- Implementar chaves únicas e `upsert`.
- Persistir os dados por site, propriedade e data.
- Registrar falhas sem interromper os demais sites.

## Fase 4 — Cron e reprocessamento

- Executar sincronização diária por site conectado.
- Processar D-1, D-2 e D-3.
- Aplicar retry e backoff para erros temporários.
- Limitar concorrência entre propriedades.
- Registrar quota e resultado por relatório.

## Fase 5 — Carga inicial

- Criar backfill de até 6 meses.
- Processar em blocos retomáveis.
- Evitar concorrência excessiva com o cron diário.
- Validar os primeiros sites no staging antes de ampliar.

## Fase 6 — Consolidação mensal e retenção

- Criar tabelas `ga4_monthly_*`.
- Gerar mensal a partir do diário.
- Validar o mensal antes da exclusão.
- Remover diários com mais de 6 meses.
- Remover mensais com mais de 27 meses.

## Fase 7 — Backend somente D1

- Alterar `/v1/ga4/analytics` para ler somente o banco.
- Aplicar limite D-1.
- Selecionar diário ou mensal conforme o período.
- Bloquear granularidades inválidas.
- Manter o mesmo formato de resposta do frontend.

## Fase 8 — Adaptação do frontend

- Ajustar filtros de período e agrupamento.
- Informar que históricos antigos são mensais.
- Exibir data da última sincronização.
- Remover dependência de atualização direta do GA4.

## Fase 9 — Testes e validação

- Comparar API atual e dados persistidos.
- Validar reprocessamento sem duplicação.
- Testar atraso e falha do GA4.
- Testar diário, mensal e período misto.
- Testar limpeza de 6 e 27 meses.
- Testar múltiplos sites simultâneos.

## Fase 10 — Staging e rollout

- Rodar build e testes.
- Fazer backfill de poucos sites.
- Comparar resultados.
- Monitorar quota e falhas.
- Ampliar gradualmente.
- Desativar a leitura direta do GA4 somente após validação.

## Critérios de conclusão da demanda

- Nenhuma tela consulta diretamente a API do GA4.
- O cron importa e atualiza D-1, D-2 e D-3.
- Reprocessamentos não duplicam dados.
- O painel exibe dados até D-1.
- Dados diários permanecem por 6 meses.
- Dados mensais permanecem até 27 meses.
- Granularidades inválidas são rejeitadas.
- O consumo de quota é observável.
- O resultado persistido é compatível com o payload atual.
