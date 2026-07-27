-- ============================================================================
-- 015_proposal_review_visibility.sql   (applied live as "proposal_review_visibility")
--
-- The review queue is meant to be worked by any active staff member, but two of
-- the things a reviewer must see were invisible to non-admin employees:
--
--   1. WHO produced the proposal. `profiles` had SELECT policies for `is_admin()`
--      and for your own row only — so an employee embedding
--      `profiles:ai_profile_id(full_name)` got NULL back, silently. Same class of
--      bug already bit the task assignee dropdown (`/dashboard/tasks/new` shows
--      an employee only themselves as a possible assignee).
--
--   2. WHICH rulebook version it was assessed against. `kb_versions` is
--      admin-only on purpose — it holds the confidential bible — and that stays
--      true here. Only the version NUMBER is denormalised onto the proposal,
--      plus a function that returns the currently active number, so a reviewer
--      can tell "this was assessed against an outdated rulebook" without any
--      access to the rules themselves.
--
-- `profiles` is a staff-only table (handle_new_user routes customers to
-- `clients` and returns early), so widening its SELECT to staff exposes
-- colleague name/email/phone to colleagues and no customer data at all.
-- Note `is_staff()` still excludes role='ai', so an AI account keeps seeing
-- only its own row.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Staff can see their colleagues
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT USING (is_staff());

-- ---------------------------------------------------------------------------
-- 2. Rulebook version number on the proposal (not the rules)
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_proposals
  ADD COLUMN IF NOT EXISTS kb_version_number integer;

COMMENT ON COLUMN public.ai_proposals.kb_version_number IS
  'Denormalised kb_versions.version at creation time. Lets staff who cannot read the admin-only kb_versions table still see which rulebook the assessment used.';

-- Backfill the proposals that already exist (none in production yet, but this
-- keeps the column consistent if any were created during testing).
UPDATE public.ai_proposals p
SET kb_version_number = v.version
FROM public.kb_versions v
WHERE p.kb_version_id = v.id
  AND p.kb_version_number IS NULL;

-- ---------------------------------------------------------------------------
-- 3. The active rulebook number, and nothing else
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so a non-admin staff member can compare against it. It
-- returns a single integer: no rules, no provenance, no document names.
--
-- EXECUTE has to be granted to `authenticated` for PostgREST to expose it at
-- all, and `authenticated` includes signed-in CUSTOMERS. They have no business
-- calling this, so the body gates on is_staff() and returns NULL otherwise —
-- the grant is the door, this is the lock.
CREATE OR REPLACE FUNCTION public.active_kb_version()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT version FROM public.kb_versions
  WHERE status = 'active' AND public.is_staff()
  LIMIT 1;
$$;

-- Same lockdown shape as check_rate_limit / activate_kb_version: revoke the
-- default PUBLIC grant, then hand it back only to signed-in users.
REVOKE ALL ON FUNCTION public.active_kb_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.active_kb_version() FROM anon;
GRANT EXECUTE ON FUNCTION public.active_kb_version() TO authenticated;
