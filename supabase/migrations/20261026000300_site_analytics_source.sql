-- Define qual fonte alimenta os painéis quando o site possui GA4 e rastreador.
alter table public.sites
  add column if not exists analytics_source text not null default 'tracker'
  check (analytics_source in ('tracker', 'ga4'));
