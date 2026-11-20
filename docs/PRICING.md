# Planos e preços — Analizi

> Rascunho de 18/11/2026. Valores de infraestrutura são estimativas com câmbio de R$ 5,80/US$ e devem ser revisados com o uso real.

## Planos

| | **Essencial** | **Crescimento** | **Pro** | **Enterprise** |
|---|---|---|---|---|
| Preço mensal | **R$ 39,90** | **R$ 59,90** | **R$ 129,90** | Sob consulta |
| Preço anual (2 meses grátis) | R$ 399/ano (≈ R$ 33,25/mês) | R$ 599/ano (≈ R$ 49,90/mês) | R$ 1.299/ano (≈ R$ 108,25/mês) | Contrato |
| Sites | 1 | 1 | 2 | Sob medida |
| Visitas/mês | 5 mil | 10 mil | 15 mil **por site** (30 mil no total) | Acima de 30 mil ou mais de 2 sites |
| Retenção de eventos brutos | 90 dias | 90 dias | 90 dias | Sob medida |
| Histórico consolidado (`daily_metrics`) | 12 meses | 24 meses | Ilimitado | Ilimitado |
| Custo por mil visitas | R$ 7,98 | R$ 5,99 | R$ 4,33 | — |

**Por que o Pro custa R$ 129,90:** ele é o plano que mais pesa no banco de dados (até ~2–3 GB por conta em 90 dias). O preço mais alto mantém a margem acima de 50% mesmo no pior caso, e o preço por mil visitas ainda cai de forma coerente (7,98 → 5,99 → 4,33). A diferença para o Crescimento também evita que quem tem 1 site grande use o Pro como atalho.

**Enterprise:** “Fale com a gente” a partir de 3 sites ou 50 mil visitas/mês. Como referência interna, não feche por menos de ~R$ 3,00 por mil visitas.

## Definição de “visita”

Uma visita é uma **sessão**: o mesmo visitante, no mesmo site, com no máximo 30 minutos sem atividade. As visualizações de página dentro da sessão não contam separadamente. É o que o cliente entende por “visita” e evita penalizar sites com muitas páginas.

## Quando o limite for ultrapassado

- **Nunca parar de coletar** imediatamente: perder dados é o pior cenário para o cliente.
- Avisar por e-mail e no painel quando o uso chegar a 80% e a 100%.
- Tolerância de até 120% no mês sem cobrança extra.
- Se o limite for ultrapassado por 2 meses seguidos, sugerir a mudança de plano; depois de 150%, pausar a coleta até o upgrade ou o próximo ciclo.

## Perspectiva de custos

### Custos fixos (independentes do número de clientes)

| Item | US$/mês | R$/mês |
|---|---|---|
| Cloudflare Workers Paid (inclui D1) | 5 | ~29 |
| Supabase Pro (auth, dados de conta) | 25 | ~145 |
| Envio de e-mail (Resend Pro, quando sair do plano gratuito) | 20 | ~116 |
| Domínio e outros | — | ~30 |
| **Total** | | **≈ R$ 320** (≈ R$ 205 sem o e-mail pago) |

Na fase inicial, o Supabase pode continuar no plano Free, o que reduz o custo fixo para cerca de R$ 60.

### Custo variável por cliente (infraestrutura)

Premissa: cerca de 4 eventos por visita (pageview, engajamento, cliques e saída), cada linha com aproximadamente 1 KB contando índices, e 90 dias de retenção.

| Plano | Eventos/mês | Armazenamento D1 em regime | Custo de infra estimado |
|---|---|---|---|
| Essencial | ~20 mil | ~60 MB | < R$ 1 |
| Crescimento | ~40 mil | ~120 MB | ~R$ 1 |
| Pro | ~120 mil | ~360 MB | ~R$ 2–3 |

A infraestrutura é praticamente irrelevante na margem. **Os custos reais por cliente são cobrança e impostos:**

| Plano | Preço | Gateway (~4% + R$ 0,40) | Imposto (Simples, ~6–15,5%) | Infra | **Margem líquida** |
|---|---|---|---|---|---|
| Essencial | 39,90 | ~2,00 | 2,40–6,20 | ~1 | **≈ R$ 31–34 (78–86%)** |
| Crescimento | 59,90 | ~2,80 | 3,60–9,30 | ~1 | **≈ R$ 47–52 (78–87%)** |
| Pro | 129,90 | ~5,60 | 7,80–20,10 | ~3 | **≈ R$ 101–113 (78–87%)** |

> O imposto depende do enquadramento: Anexo III (~6%) se o fator R for ≥ 28%, caso contrário Anexo V (~15,5%). Vale confirmar com o contador. O Pix e a cobrança anual reduzem a taxa do gateway.

### Pior caso: conta no limite máximo

Premissas pessimistas: **15 eventos por visita**; **8 escritas de linha por evento** (a tabela `events` tinha 7 índices; com a migration 0026, passam a ser 4); ~1,5 KB por evento; e **todo uso cobrado como excedente**, ignorando a franquia incluída no plano de US$ 5 da Cloudflare (US$ 1/M escritas, US$ 0,30/M requisições, US$ 0,75/GB-mês).

| Plano | Eventos/mês | Armazenamento (90 dias) | Infra no limite | Infra a 150% | Margem a 150% (imposto de 15,5%) |
|---|---|---|---|---|---|
| Essencial | 75 mil | ~0,35 GB | ~R$ 4 | ~R$ 6 | ≈ R$ 25 (64%) |
| Crescimento | 150 mil | ~0,7 GB | ~R$ 8 | ~R$ 13 | ≈ R$ 35 (58%) |
| Pro | 450 mil | ~2 GB | ~R$ 25 | ~R$ 37 | ≈ R$ 67 (52%) |

Mesmo no pior caso, nenhum plano dá prejuízo. O ponto sensível é o **limite de 10 GB por banco D1**: um Pro no pior caso ocupa ~2–3 GB, então só cabem 3 ou 4 contas assim por banco.

Mitigações (sem limitar eventos por sessão):
- **Tempo de permanência:** já é medido sem envio periódico: o `scroll_depth` enviado ao sair ou ocultar a aba carrega o tempo acumulado com a aba visível (padrão GA4).
- **Índices:** a migration `0026_drop_unused_event_indexes.sql` remove 4 dos 7 índices de `events` (visitante, origem, campanha e localização), que nenhuma consulta usa. Ficam os índices por data, sessão e página (o mapa de calor filtra por página). As escritas caem de 8 para 4 por evento (−50%).
- Agregar nas tabelas `daily_*` e, se necessário, reduzir a retenção bruta do Pro para 60 dias.

### E-mail (relatórios e alertas)

Volume por destinatário e por site, no pior caso: relatório diário opcional (30) + semanal (4) + mensal (1) + alertas de limite e anomalias (~5) ≈ **40 e-mails/mês**.

| Plano | Destinatários por site | Pior caso/mês | Custo com SES (US$ 0,10/mil) | Custo com Resend Pro (US$ 20 por 50 mil) |
|---|---|---|---|---|
| Essencial | 1 | ~40 | < R$ 0,05 | ~R$ 0,10 |
| Crescimento | 3 | ~120 | < R$ 0,10 | ~R$ 0,30 |
| Pro | 5 (× 2 sites) | ~400 | ~R$ 0,25 | ~R$ 1,00 |

O e-mail é essencialmente um **custo fixo por faixa**, não por cliente:
- **Início:** plano gratuito do Resend (~3 mil e-mails/mês, 100/dia), suficiente para cerca de 50–70 contas se o relatório diário estiver desligado → R$ 0.
- **Crescimento:** Resend Pro (~US$ 20 ≈ R$ 116/mês) cobre 50 mil e-mails/mês, ou seja, ~125 contas Pro no pior caso.
- **Escala:** Amazon SES (ou o envio de e-mail da Cloudflare) passa a ser mais barato que o Resend acima de ~200 mil e-mails/mês.

Regras para conter custo e reputação de envio: relatório diário apenas no Crescimento e no Pro; limitar o número de destinatários por plano; envio em lote por fuso horário; descadastro em um clique; SPF/DKIM/DMARC no domínio (gratuitos).

> Os preços dos provedores são referências aproximadas; confirme os valores atuais antes de contratar.

### Ponto de equilíbrio

- Custo fixo de cerca de R$ 205/mês ÷ ~R$ 32 de margem no Essencial = **~7 clientes Essencial** (ou 3 Pro).
- Com o e-mail pago (R$ 320/mês): **~10 clientes Essencial** (ou 4 Pro). Na prática, o plano pago de e-mail só é necessário com mais de ~60 contas, quando a receita já cobre com folga.
- Com o Supabase Free: **2 clientes**.

### Riscos de custo para monitorar

1. **Limite de 10 GB por banco D1.** Com cerca de 60–360 MB por cliente, um único banco comporta aproximadamente 30–150 clientes. Antes disso, é preciso particionar (um banco D1 por grupo de clientes) ou agregar mais cedo em `daily_metrics` e reduzir a retenção bruta.
2. **Bots e picos de tráfego** inflam eventos. Filtrar bots e deduplicar antes de gravar, como já previsto na Fase 2.
3. **Leituras do painel:** consultar sempre os agregados, nunca varrer os eventos brutos.

## Próximos passos de implementação

- Tabela `plans` e coluna `plan_id`/`billing_cycle` em `businesses` (Supabase).
- Contador mensal de sessões por site para aplicar os limites e os avisos de 80%/100%.
- Página de preços na landing e tela de upgrade no painel.
- Integração com gateway (Asaas, Stripe ou Mercado Pago): assinatura com cartão e Pix.
