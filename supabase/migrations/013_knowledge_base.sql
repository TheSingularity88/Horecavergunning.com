-- ============================================================================
-- 013_knowledge_base.sql   (applied live as "knowledge_base")
--
-- Foundation for the AI system: an ADMIN-ONLY knowledge base of confidential
-- municipal assessment documents, and versioned "bible" snapshots produced by
-- analyzing them with an AI provider.
--
-- Design decisions that matter here:
--
--   * A SEPARATE bucket 'kb', not a kb/ prefix inside 'documents'. The four
--     documents_staff_* policies in 003 grant is_staff() the whole bucket with
--     no path constraint; carving out a prefix would mean rewriting all four,
--     and any future policy regression would silently re-expose the corpus to
--     every employee. A dedicated bucket whose only policies are is_admin()
--     fails safe instead.
--
--   * kb_versions rows are IMMUTABLE snapshots. Every "Analyze" run creates a
--     new draft; nothing consumes a draft until an admin activates it. That
--     human gate is also the prompt-injection defence: a poisoned source
--     document can at worst produce a poisoned DRAFT, which a human must read
--     and activate before any case-assessing AI ever sees it.
--
--   * Only ONE version can be active (partial unique index), and activation is
--     an atomic SECURITY DEFINER function so "archive current + promote new"
--     cannot half-happen. EXECUTE is revoked from clients; only the service
--     role calls it (same treatment as check_rate_limit in 002).
--
--   * contains_pii / redaction_terms: doc corpus includes named civil servants
--     and police contacts. Redaction happens app-side before any text leaves
--     for a provider; these columns carry the admin's instructions for it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Registry of confidential source documents (files live in bucket 'kb').
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kb_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename        TEXT NOT NULL,
  storage_path    TEXT NOT NULL UNIQUE,          -- {id}/{filename} inside bucket 'kb'
  mime_type       TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  sha256          TEXT NOT NULL,                 -- provenance + change detection
  notes           TEXT,
  contains_pii    BOOLEAN NOT NULL DEFAULT false,
  redaction_terms TEXT[] NOT NULL DEFAULT '{}',  -- literal strings scrubbed before provider calls
  include_images  BOOLEAN NOT NULL DEFAULT false,-- opt-in: forward embedded images to the model
  uploaded_by     UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_kb_documents_updated_at
  BEFORE UPDATE ON public.kb_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

-- Admin-only on every verb. Writes actually go through the service role after
-- requireAdmin(), so these policies are the browser-read backstop.
DROP POLICY IF EXISTS "kb_documents_select_admin" ON public.kb_documents;
DROP POLICY IF EXISTS "kb_documents_insert_admin" ON public.kb_documents;
DROP POLICY IF EXISTS "kb_documents_update_admin" ON public.kb_documents;
DROP POLICY IF EXISTS "kb_documents_delete_admin" ON public.kb_documents;

CREATE POLICY "kb_documents_select_admin" ON public.kb_documents
  FOR SELECT USING (public.is_admin());
CREATE POLICY "kb_documents_insert_admin" ON public.kb_documents
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "kb_documents_update_admin" ON public.kb_documents
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "kb_documents_delete_admin" ON public.kb_documents
  FOR DELETE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- Versioned bible snapshots. One row per Analyze run; immutable after insert.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kb_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version            INTEGER NOT NULL,
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'active', 'archived')),
  rules              JSONB NOT NULL,             -- the bible (see app/lib/ai/bible-schema.ts)
  rendered_markdown  TEXT NOT NULL,              -- human-readable rendering for review
  provider           TEXT NOT NULL,              -- 'anthropic' | ...
  model              TEXT NOT NULL,
  prompt_version     TEXT NOT NULL,              -- exported const from the prompt module
  source_documents   JSONB NOT NULL,             -- [{id, filename, sha256}] snapshot at run time
  redactions_applied JSONB,                      -- {term_or_pattern: count} — never the originals
  input_tokens       INTEGER,
  output_tokens      INTEGER,
  latency_ms         INTEGER,
  created_by         UUID REFERENCES public.profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at       TIMESTAMPTZ,
  activated_by       UUID REFERENCES public.profiles(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS kb_versions_one_active
  ON public.kb_versions (status) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS kb_versions_version
  ON public.kb_versions (version);

ALTER TABLE public.kb_versions ENABLE ROW LEVEL SECURITY;

-- Admin-only read; no write policies at all (service role only).
DROP POLICY IF EXISTS "kb_versions_select_admin" ON public.kb_versions;
CREATE POLICY "kb_versions_select_admin" ON public.kb_versions
  FOR SELECT USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- Atomic activation: archive whatever is active, promote the target.
-- Returns false when the target does not exist or is already active.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_kb_version(p_id UUID, p_admin UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.kb_versions SET status = 'archived' WHERE status = 'active' AND id <> p_id;

  UPDATE public.kb_versions
     SET status = 'active', activated_at = now(), activated_by = p_admin
   WHERE id = p_id AND status IN ('draft', 'archived');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.activate_kb_version(UUID, UUID) FROM anon, authenticated, public;

-- ----------------------------------------------------------------------------
-- Storage: dedicated private bucket, admin-only policies.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb', 'kb', false, 10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "kb_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "kb_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "kb_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "kb_admin_delete" ON storage.objects;

CREATE POLICY "kb_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kb' AND public.is_admin());

CREATE POLICY "kb_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kb' AND public.is_admin());

CREATE POLICY "kb_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'kb' AND public.is_admin());

CREATE POLICY "kb_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'kb' AND public.is_admin());
