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

### 3. Persistência diária

Criar o armazenamento diário específico do GA4 e o controle de sincronização.

- Criar migrações.
- Definir chaves únicas.
- Implementar `upsert`.
- Registrar status e falhas por site.

### 4. Cron e reprocessamento

Importar o GA4 diariamente e corrigir os dias recentes.

- Processar D-1, D-2 e D-3.
- Controlar concorrência entre sites.
- Aplicar retry e backoff.
- Registrar consumo e resultado das consultas.

### 5. Carga inicial

Preencher o histórico de uma nova conexão sem sobrecarregar a API.

- Importar até 6 meses.
- Processar em blocos retomáveis.
- Separar backfill do cron diário.

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
