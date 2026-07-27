-- ============================================================================
-- 021_case_update_proposal.sql   (applied live as "case_update_proposal")
--
-- Lets an AI propose editing a case's own fields.
--
-- Until now it could propose a status change or a draft reply and nothing else,
-- so the ordinary employee act of correcting a municipality, setting a deadline
-- or fixing a title had no path at all — not even a reviewable one.
--
-- These are PROPOSALS rather than direct writes because the client portal
-- renders them: title, description, municipality, deadline and reference number
-- all appear on the customer's own case page. The lesson from the checklist
-- tool holds — check where a field is RENDERED before calling it internal.
-- ============================================================================

ALTER TABLE public.ai_proposals DROP CONSTRAINT IF EXISTS ai_proposals_proposal_type_check;

ALTER TABLE public.ai_proposals ADD CONSTRAINT ai_proposals_proposal_type_check
  CHECK (proposal_type IN (
    'case_assessment',
    'draft_reply',
    'status_change',
    'checklist_update',
    'question',
    'case_update'
  ));
