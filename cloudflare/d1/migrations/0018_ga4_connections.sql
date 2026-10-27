-- Credenciais de longa duração do GA4 ficam apenas no Worker, cifradas antes
-- de serem persistidas. Nunca expor estes campos pela API pública.
create table if not exists ga4_connections (
  supabase_site_id text primary key,
  tracker_site_id text not null,
  property_id text not null,
  google_user_id text,
  refresh_token_ciphertext text not null,
  refresh_token_iv text not null,
  connected_at text not null default current_timestamp,
  last_synced_at text,
  last_error text
);

create unique index if not exists ga4_connections_tracker_site_idx
  on ga4_connections(tracker_site_id);
