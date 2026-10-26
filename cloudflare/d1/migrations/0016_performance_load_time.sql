-- Migration 0016: Adiciona colunas para load_time_ms em events e daily_pages
alter table events add column load_time_ms integer;
alter table daily_pages add column average_load_time_ms integer not null default 0;
