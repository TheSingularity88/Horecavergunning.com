-- ============================================================================
-- 004_advisor_hardening.sql
-- Fixes issues raised by the Supabase security advisor after 002/003:
--   * Trigger functions (handle_new_user, handle_client_signup) were callable
--     by anon/authenticated via /rest/v1/rpc — revoked entirely (only the
--     auth.users triggers invoke them).
--   * RLS helper functions revoked from anon (policies never evaluate them
--     for anon in this app; authenticated keeps EXECUTE because RLS policy
--     expressions run with the caller's privileges).
--   * Pins search_path on the remaining unpinned functions.
-- Note: "rate_limits has RLS but no policies" is INTENTIONAL — only the
-- service role uses that table. "Leaked password protection disabled" must
-- be toggled in the Supabase Auth dashboard (cannot be set via SQL).
-- ============================================================================

-- Trigger functions: nobody should call these via the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_client_signup() FROM anon, authenticated, public;

-- RLS helpers: not needed by anon.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_client() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_client_id() FROM anon;

-- Pin search_path on remaining functions flagged by the advisor.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_client_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    INSERT INTO public.clients (
      user_id, company_name, contact_name, email, kvk_number, phone, status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unknown Company'),
      COALESCE(NEW.raw_user_meta_data->>'contact_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      NEW.raw_user_meta_data->>'kvk_number',
      NEW.raw_user_meta_data->>'phone',
      'active'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
