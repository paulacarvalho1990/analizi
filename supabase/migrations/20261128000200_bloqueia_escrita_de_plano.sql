-- =============================================================================
-- Migration: navegador não altera plano, assinatura nem dono (card #99, parte B)
-- Não depende do front: pode ser aplicada a qualquer momento.
-- =============================================================================

-- Escrita direta: só as colunas que o app edita. O RLS limita linhas, não colunas,
-- e revogar por coluna não desfaz um grant de tabela; por isso revoga e concede de novo.
-- Perfis nascem pelo trigger handle_new_user; negócios, por create_business_for_current_user.
revoke insert, update, delete, truncate on public.profiles, public.businesses from anon, authenticated;
grant update (full_name, email, phone) on public.profiles to authenticated;
grant update (name, website_url, segment, subsegment, segment_detail) on public.businesses to authenticated;
