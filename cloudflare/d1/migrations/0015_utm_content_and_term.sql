-- Migration 0015: Adiciona colunas para utm_content e utm_term e atualiza índices de campanha
alter table events add column campaign_content text;
alter table events add column campaign_term text;

create index if not exists events_site_campaign_idx on events (tracker_site_id, campaign, campaign_content, campaign_term);
