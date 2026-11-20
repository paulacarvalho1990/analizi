-- Remove índices de `events` que nenhuma consulta usa para buscar linhas.
-- A consolidação diária filtra por date(occurred_at) e varre o período; os painéis leem as tabelas daily_*.
-- Cada índice a menos elimina 1 escrita por evento gravado e reduz o armazenamento do D1.
-- Mantidos: events_site_time_idx, events_site_session_idx e events_site_page_idx (mapa de calor por página).
drop index if exists events_site_visitor_idx;
drop index if exists events_site_source_idx;
drop index if exists events_site_campaign_idx;
drop index if exists events_site_location_idx;
