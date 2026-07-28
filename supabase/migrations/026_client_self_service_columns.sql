-- ============================================================================
-- 026_client_self_service_columns.sql
--
-- A customer could overwrite the office's own notes on their client row, and
-- change their own status.
--
-- `clients_update_own` is USING (user_id = auth.uid()) — row-scoped, and
-- Postgres RLS CANNOT restrict columns. So the policy correctly decided "this
-- is your row" and then let the caller write every column in it. Proven against
-- production by running an UPDATE as a real customer's role: the office note
-- came back "WIPED BY CUSTOMER".
--
-- Column-level GRANTs are the textbook answer and do not work here: staff and
-- customers share the `authenticated` role, and the staff client-edit screen
-- writes through the browser client. Revoking UPDATE on `notes` from
-- `authenticated` would break the office's own screen.
--
-- So: a trigger, in the shape this codebase already uses twice
-- (reject_employment_type_change in 023, reject_api_key_secret_change in 024).
-- ============================================================================

-- Exactly what app/client/profile/page.tsx submits. Everything else on the row
-- belongs to the office: notes, status, assigned_employee_id, kvk_number, and
-- email — which is the login identity, not a contact detail.
CREATE OR REPLACE FUNCTION public.reject_client_field_overreach()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL means there is no end-user session: our own server
  -- actions on the service-role key. Those are already guarded by requireStaff
  -- before they get here, and RLS would refuse an anonymous caller outright, so
  -- letting them through is safe — and NOT doing so would block every staff
  -- write the moment this trigger existed, since is_staff() reads auth.uid().
  IF auth.uid() IS NULL OR public.is_staff() THEN
    RETURN NEW;
  END IF;

  IF NEW.notes                IS DISTINCT FROM OLD.notes
     OR NEW.status            IS DISTINCT FROM OLD.status
     OR NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id
     OR NEW.email             IS DISTINCT FROM OLD.email
     OR NEW.kvk_number        IS DISTINCT FROM OLD.kvk_number
     OR NEW.user_id           IS DISTINCT FROM OLD.user_id
     OR NEW.id                IS DISTINCT FROM OLD.id
     OR NEW.created_at        IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION
      'You can update your own contact details only. Ask our office to change anything else.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_client_field_overreach() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS clients_self_service_columns ON public.clients;
CREATE TRIGGER clients_self_service_columns
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.reject_client_field_overreach();
