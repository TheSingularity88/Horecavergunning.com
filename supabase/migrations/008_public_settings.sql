-- ============================================================================
-- 008_public_settings.sql
-- Allow anonymous (and authenticated) visitors to read ONLY the whitelisted
-- public settings — keys prefixed with 'public_' (contact details shown in the
-- footer, WhatsApp number, social-proof mode). All other system_settings keys
-- remain admin-only. Writes still go through the admin server action.
-- ============================================================================

CREATE POLICY "system_settings_select_public" ON public.system_settings
  FOR SELECT
  TO anon, authenticated
  USING (key LIKE 'public\_%');
