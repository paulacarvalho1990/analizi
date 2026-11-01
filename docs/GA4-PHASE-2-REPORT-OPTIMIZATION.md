# Fase 2 — Otimização dos relatórios GA4

## Status

Implementação inicial concluída e validada com build local. A medição em uma propriedade GA4 real ainda depende de execução autenticada do endpoint.

## Alterações realizadas

### Redução de chamadas

O endpoint atual mantém dez chamadas `runReport` por consulta, mas elimina a duplicação entre os relatórios diário atual e diário anterior. A nova composição inclui `peakHours` e sessões de contato por página, que não existiam no endpoint GA4.

Os relatórios de métricas do período atual e do período anterior foram unidos em uma única consulta diária contínua, cobrindo `previousStart` até `end`.

O Worker separa novamente as linhas em:

- período atual: `start <= date <= end`;
- período anterior: `previousStart <= date < start`.

Os demais relatórios continuam separados porque possuem diferentes granularidades e combinações de dimensões.

### Relatórios mantidos separados

- fontes, mídias e campanhas;
- páginas;
- origem e landing page;
- dispositivos e navegadores;
- localizações;
- eventos de conversão;
- detalhes de cliques e eventos;
- horários de pico.

Os relatórios de conversão e cliques não foram unidos nesta etapa. A combinação poderia aumentar a cardinalidade e gerar mais custo ou truncamento que duas consultas menores.

### Campos anteriormente ausentes

- `pageConversionResults` é derivado dos relatórios de páginas, eventos e sessões de contato por página.
- `peakHours` é preenchido por um relatório com `dayOfWeek`, `hour`, `sessions`, `screenPageViews` e `keyEvents`.
- `page-contact-sessions` calcula sessões com eventos de contato (`whatsapp_contact`, `whatsapp_click`, `sign_up` e `form_submit`) por página.

### Medição adicionada

Cada relatório agora solicita `returnPropertyQuota: true` e registra no log:

- nome da família;
- intervalo consultado;
- dimensões;
- métricas;
- `rowCount`;
- quantidade de linhas retornadas;
- quota retornada pelo GA4.

Os relatórios agora usam paginação com até 100.000 linhas por página. Quando, mesmo após a paginação, `rowCount` supera a quantidade efetivamente retornada, o Worker emite `ga4_report_truncated`.

### Datas e timezone

As datas retornadas pelo GA4 no formato `YYYYMMDD` são normalizadas para `YYYY-MM-DD` antes da separação entre período atual e anterior.

O limite D-1 usa a timezone persistida no site. Enquanto o campo `timezone` ainda não existir ou estiver inválido no Supabase, o Worker usa `America/Sao_Paulo` como fallback e registra a ocorrência.

## Resultado esperado

O ganho imediato é a eliminação de uma consulta duplicada entre o período atual e o anterior. A quantidade final é dez relatórios porque foram adicionadas consultas funcionais para `peakHours` e sessões de contato por página. O ganho real de quota ainda precisa ser medido, porque o custo do GA4 depende de linhas, dimensões, período, filtros e cardinalidade.

## Validação executada

- TypeScript compilado com sucesso.
- Build Vite concluído com sucesso.
- `git diff --check` sem erros.
- Payload de saída preservado no código de transformação.
- Separação entre período atual e anterior preservada.
- Datas `YYYYMMDD` normalizadas antes das comparações.
- Paginação implementada para relatórios com mais de 10.000 linhas.
- Cálculo de D-1 alterado para usar a timezone fixa `America/Sao_Paulo`.
- `pageConversionResults` preenchido para GA4.
- `peakHours` preenchido para GA4.
- Sessões de contato por página calculadas com métrica `sessions`, sem tratar `keyEvents` como sessões.

## Validação pendente

- Executar o endpoint com uma propriedade GA4 conectada.
- Comparar `propertyQuota` antes e depois da alteração.
- Verificar `rowCount` e truncamento por família.
- Confirmar compatibilidade de todas as dimensões e métricas.
- Testar períodos longos próximos do limite de 730 dias.
- Decidir se algum relatório adicional pode ser combinado sem aumentar o custo.
- Persistir e expor uma configuração `timezone` por site como evolução posterior.

## Próximo passo

Executar uma medição controlada em staging e, com os números reais de quota e cardinalidade, decidir se a Fase 2 deve incluir paginação, divisão por data ou uma nova combinação de métricas.
