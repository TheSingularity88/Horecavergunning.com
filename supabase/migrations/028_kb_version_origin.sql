-- ============================================================================
-- 028_kb_version_origin.sql
--
-- Where a rulebook version came from.
--
-- The Analyze run takes ~17.7 minutes against a maxDuration of 300s, so it
-- cannot finish on Vercel — the rulebook could not be regenerated on the live
-- site at all. Generation moves off the platform: an admin produces the JSON on
-- their own machine (where the confidential documents stay) and imports it.
--
-- The two kinds of version are otherwise identical and share every downstream
-- path — review, diff, activate, rollback — so they differ only in provenance,
-- and the UI must not present an import as though a model had been billed for
-- it. DEFAULT 'analysis' leaves every existing row correct.
-- ============================================================================

ALTER TABLE public.kb_versions
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'analysis';

ALTER TABLE public.kb_versions DROP CONSTRAINT IF EXISTS kb_versions_origin_check;
ALTER TABLE public.kb_versions ADD CONSTRAINT kb_versions_origin_check
  CHECK (origin IN ('analysis', 'import'));

COMMENT ON COLUMN public.kb_versions.origin IS
  'analysis = produced by runKbAnalysis on this platform. import = generated offline and uploaded; provider/model/prompt_version describe the offline run, and the token columns are NULL because we spent nothing.';
