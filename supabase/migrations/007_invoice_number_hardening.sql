-- ============================================================================
-- 007_invoice_number_hardening.sql
-- Pin search_path on next_invoice_number (advisor WARN 0011).
-- Note: the remaining advisor warnings about is_admin/is_staff/is_client/
-- get_client_id being EXECUTE-able (via the PUBLIC grant) are accepted: they
-- are SECURITY DEFINER helpers that only reveal the CALLER's own status, are
-- required by RLS policy expressions, and expose nothing an authenticated user
-- doesn't already know about themselves.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT AS $$
  SELECT 'HV-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$ LANGUAGE sql SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.next_invoice_number() FROM anon, authenticated, public;
