-- Metadados seguros para a UI. O refresh token fica exclusivamente cifrado no
-- banco D1 do Worker e não é gravado no Supabase.
alter table public.data_sources
  add column if not exists ga4_property_name text,
  add column if not exists ga4_connected_google_email text;
