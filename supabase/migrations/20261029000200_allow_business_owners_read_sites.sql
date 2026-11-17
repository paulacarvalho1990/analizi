-- Negócios criados antes da padronização podem não ter a linha de owner em
-- business_members. O proprietário continua podendo ler seus próprios sites
-- e fontes sem ampliar o acesso dos demais usuários.
create policy "business owners can read sites" on public.sites
  for select using (
    exists (
      select 1 from public.businesses
      where businesses.id = sites.business_id
        and businesses.owner_id = auth.uid()
    )
  );

create policy "business owners can read data sources" on public.data_sources
  for select using (
    exists (
      select 1 from public.sites
      join public.businesses on businesses.id = sites.business_id
      where sites.id = data_sources.site_id
        and businesses.owner_id = auth.uid()
    )
  );
