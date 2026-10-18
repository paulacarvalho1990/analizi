-- Classificação usada para análises internas por tipo de negócio e site.
alter table public.businesses
  add column if not exists subsegment text,
  add column if not exists segment_detail text;

alter table public.business_members
  add column if not exists creator_role text
  check (creator_role is null or creator_role in ('owner_partner', 'developer', 'employee', 'other'));

comment on column public.businesses.segment is 'Categoria principal: products, services ou health.';
comment on column public.businesses.subsegment is 'Tipo selecionado dentro da categoria principal.';
comment on column public.businesses.segment_detail is 'Detalhamento obrigatório no formulário quando subsegment for Outros.';
comment on column public.business_members.creator_role is 'Função da pessoa que criou ou administra o negócio.';

create index if not exists businesses_segment_subsegment_idx
  on public.businesses (segment, subsegment);
