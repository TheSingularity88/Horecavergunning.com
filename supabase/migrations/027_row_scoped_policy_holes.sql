-- ============================================================================
-- 027_row_scoped_policy_holes.sql
--
-- The same bug class as 026, found in two more places by reviewing 026, plus a
-- correction to 026 itself.
--
-- The class: an RLS policy decides WHICH ROW you may write and then, because
-- Postgres RLS cannot restrict columns, lets you write ANY COLUMN in it. Every
-- instance below was proven with a rolled-back probe against production.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. A customer could file a document into ANOTHER customer's dossier
-- ---------------------------------------------------------------------------
-- documents_insert_client OR'd its two arms:
--   client_id = get_client_id() OR case_id IN (my cases)
-- Satisfying the second arm with one's own case left client_id free to name any
-- other client. Probed: the row appeared in the victim's portal, and because
-- the policy forces uploaded_by NULL — the marker of a genuine customer upload
-- — it was indistinguishable from something the victim had submitted.

DROP POLICY IF EXISTS "documents_insert_client" ON public.documents;
CREATE POLICY "documents_insert_client" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by IS NULL
    -- AND, not OR: the document is mine, and if it names a case that case is
    -- mine too.
    AND client_id = public.get_client_id()
    AND (case_id IS NULL OR case_id IN (
      SELECT id FROM public.cases WHERE client_id = public.get_client_id()
    ))
  );

-- ---------------------------------------------------------------------------
-- 2. A customer could file a request pre-stamped "approved" by a named admin
-- ---------------------------------------------------------------------------
-- client_requests_insert_own checked only client_id, while `authenticated` held
-- INSERT on every column. Probed: status='approved', reviewed_by=<a real admin>
-- and an office-authored note all stored verbatim. The row then wedged the
-- queue — both Approve and Reject gate on pending/reviewing, so neither button
-- could touch it, ever.
--
-- The portal already submits through a server action that hardcodes
-- status='pending'; this policy is what still permitted the raw browser insert.
-- The office's own fields must be absent, not merely defaulted.

DROP POLICY IF EXISTS "client_requests_insert_own" ON public.client_requests;
CREATE POLICY "client_requests_insert_own" ON public.client_requests
  FOR INSERT WITH CHECK (
    client_id = public.get_client_id()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND converted_to_case_id IS NULL
    AND notes IS NULL
  );

-- ---------------------------------------------------------------------------
-- 3. 026's trigger was a denylist; make it an allowlist
-- ---------------------------------------------------------------------------
-- It enumerated the columns a customer may NOT touch. Exhaustive against
-- today's schema, but inverted: add a column in some later migration and it is
-- customer-writable the moment it exists, silently. Probed by adding a
-- `payment_terms` column and writing it as a customer — accepted, no error.
--
-- Now the six columns app/client/profile/page.tsx actually submits are named,
-- and everything else — present or future — belongs to the office by default.

CREATE OR REPLACE FUNCTION public.reject_client_field_overreach()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL means no end-user session: our own service-role calls,
  -- already behind requireStaff. Without this the trigger would block every
  -- staff server action, because is_staff() reads auth.uid().
  IF auth.uid() IS NULL OR public.is_staff() THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - ARRAY[
        'company_name', 'contact_name', 'phone', 'address', 'city',
        'postal_code', 'updated_at'
      ])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY[
        'company_name', 'contact_name', 'phone', 'address', 'city',
        'postal_code', 'updated_at'
      ])
  THEN
    RAISE EXCEPTION
      'You can update your own contact details only. Ask our office to change anything else.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_client_field_overreach() FROM PUBLIC, anon, authenticated;
