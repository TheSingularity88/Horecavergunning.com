-- ============================================================================
-- 003_storage_policies.sql
-- The 'documents' bucket existed with ZERO storage.objects policies, meaning
-- all client-side uploads/downloads were denied (and nothing was version-
-- controlled). This migration:
--   * enforces a 10MB size limit + document mime-type allowlist at bucket level
--   * staff: full access to the bucket
--   * clients: access only under their own  clients/{client_id}/  prefix
-- ============================================================================

-- Bucket hard limits (backstop for any client-side validation).
UPDATE storage.buckets
SET
  file_size_limit = 10485760, -- 10 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
WHERE id = 'documents';

-- Clean slate (no policies existed, but keep this re-runnable).
DROP POLICY IF EXISTS "documents_staff_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_staff_delete" ON storage.objects;
DROP POLICY IF EXISTS "documents_client_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_client_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_client_delete" ON storage.objects;

-- Staff: full access to the documents bucket.
CREATE POLICY "documents_staff_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff());

CREATE POLICY "documents_staff_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.is_staff());

CREATE POLICY "documents_staff_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff());

CREATE POLICY "documents_staff_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff());

-- Clients: only within their own clients/{client_id}/ folder.
CREATE POLICY "documents_client_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'clients'
    AND (storage.foldername(name))[2] = public.get_client_id()::text
  );

CREATE POLICY "documents_client_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'clients'
    AND (storage.foldername(name))[2] = public.get_client_id()::text
  );

CREATE POLICY "documents_client_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'clients'
    AND (storage.foldername(name))[2] = public.get_client_id()::text
  );
