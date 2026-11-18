-- Tipo de site: define apenas quais resultados aparecem no relatório.
-- A captura de eventos é a mesma para todos os tipos.
alter table public.sites
  add column if not exists site_type text not null default 'servicos';

do $$ begin
  alter table public.sites add constraint sites_site_type_check
    check (site_type in ('servicos', 'agendamento', 'ecommerce', 'saas', 'reservas', 'conteudo'));
exception when duplicate_object then null; end $$;
