-- Garante que sites existentes também tenham a fonte nativa padrão.
-- Sites criados antes do fluxo de onboarding já possuem um tracker_site_id,
-- mas podem não ter um registro correspondente em data_sources.
insert into public.data_sources (site_id, kind, status, connected_at)
select s.id, 'tracker'::public.source_kind, 'pending'::public.source_status, s.created_at
from public.sites s
where not exists (
  select 1
  from public.data_sources ds
  where ds.site_id = s.id
    and ds.kind = 'tracker'::public.source_kind
);
