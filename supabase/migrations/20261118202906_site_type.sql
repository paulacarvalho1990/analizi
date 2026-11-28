alter table public.sites
  add column site_type text not null default 'servicos'
  check (site_type in ('servicos', 'agendamento', 'ecommerce', 'saas', 'reservas', 'conteudo'));
