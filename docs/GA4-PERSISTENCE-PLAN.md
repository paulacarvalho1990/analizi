# Plano de atualização do GA4

## Objetivo

Fazer com que o Analizi consulte o GA4 somente por cron, persista os dados no D1 e mantenha o painel funcionando com dados diários e mensais.

## Política definida

- Painel disponível até D-1.
- Dados diários por 6 meses.
- Dados mensais do 7º ao 27º mês.
- Exclusão após 27 meses.
- Granularidade menor que mensal bloqueada acima de 6 meses.
- Reprocessamento GA4 de D-1, D-2 e D-3 com `upsert`.
- Datas do GA4 calculadas usando `America/Sao_Paulo` enquanto a configuração por site não estiver persistida.
- Mesma política para GA4 e rastreador.

## Etapas

### 1. Diagnóstico e contrato de dados

Mapear o fluxo atual, os dados usados pelas telas, os relatórios GA4, o payload compartilhado e os critérios de medição de quota.

- Inventariar consumidores do analytics.
- Definir o contrato de saída do backend.
- Identificar relatórios que podem compartilhar métricas.
- Registrar decisões, riscos e pontos que exigem teste.

### 2. Otimização dos relatórios

Reduzir chamadas ao GA4 sem perder as informações necessárias ao produto.

- Validar compatibilidade entre dimensões e métricas.
- Testar agrupamento de métricas por família de relatório.
- Medir linhas, duração e quota.
- Escolher a menor configuração segura.

### 3. Persistência GA4 e schema de consolidação

Criar a estrutura persistida do GA4 para suportar o histórico diário e mensal, sem alterar ainda o fluxo de ingestão das telas.

- Criar tabelas físicas separadas para dados diários e mensais de métricas, aquisição, páginas, dispositivos, localizações, contatos, cliques, eventos de conversão e horários de pico.
- Criar o controle de execuções e períodos de sincronização por site e propriedade.
- Definir chaves únicas para permitir reprocessamento idempotente; em cliques, usar `dimension_key` derivada por hash das dimensões textuais.
- Aplicar as migrations `0020`–`0023` e validar o schema no staging.
- Deixar o `upsert` de dados, o cron e a atualização dos status de sincronização para as fases de execução.

### 4. Cron e reprocessamento

Importar o GA4 diariamente e corrigir os dias recentes.

- Processar D-1, D-2 e D-3.
- Controlar concorrência entre sites.
- Aplicar retry e backoff.
- Registrar consumo e resultado das consultas.

### 5. Carga histórica sob demanda — postergada

Não executar carga histórica no momento da conexão. A primeira captura ocorrerá somente no próximo cron diário, e os dados estarão disponíveis para consulta no dia seguinte.

- Ao conectar, apenas testar a autorização, salvar a conexão e confirmar sucesso.
- O cron diário será responsável por capturar D-1, D-2 e D-3.
- Manter um eventual backfill de até 6 meses como capacidade futura, separado do cron diário e condicionado a uma decisão explícita.

### 6. Consolidação mensal e retenção

Reduzir armazenamento mantendo histórico suficiente para análise.

- Gerar mensais a partir dos diários.
- Validar antes de remover diários.
- Remover diários após 6 meses.
- Remover mensais após 27 meses.

### 7. Backend somente D1

Fazer o endpoint de analytics ler exclusivamente os consolidados.

- Selecionar diário ou mensal conforme o período.
- Aplicar limite D-1.
- Bloquear granularidades inválidas.
- Preservar o payload atual.

### 8. Adaptação do frontend

Adaptar filtros e mensagens para a nova disponibilidade de granularidade.

- Informar quando o histórico for mensal.
- Exibir a data da última sincronização.
- Remover dependência de consulta direta ao GA4.
- Ao conectar o GA4, exibir o banner de acompanhamento de 24 horas com texto específico para GA4.
- Ao concluir as 24 horas, exibir uma confirmação no sistema somente depois de validar que o cron capturou e persistiu dados do GA4.
- A conexão deve apenas testar a autorização, salvar a configuração e confirmar sucesso; não deve iniciar uma carga imediata. Os dados serão capturados no próximo cron e estarão disponíveis para consulta no dia seguinte.
- Envio de email ao final das 24 horas fica registrado no backlog, sem fazer parte da primeira implementação.

### 9. Testes e validação

Garantir equivalência, consistência e segurança da migração.

- Comparar API atual e dados persistidos.
- Testar reprocessamento sem duplicação.
- Testar falhas, atrasos e períodos mistos.
- Testar retenção e filtros.

### 10. Staging e rollout

Validar gradualmente antes de desligar a leitura direta do GA4.

- Rodar build e testes.
- Fazer backfill controlado.
- Monitorar quota e falhas.
- Ampliar por etapas.
- Desativar a leitura direta somente após validação.

## Critérios de conclusão

- Telas não consultam diretamente a API do GA4.
- Cron atualiza D-1, D-2 e D-3.
- Reprocessamento não duplica dados.
- Retenção diária/mensal funciona conforme definido.
- Granularidades inválidas são rejeitadas.
- Consumo da API é observável.
