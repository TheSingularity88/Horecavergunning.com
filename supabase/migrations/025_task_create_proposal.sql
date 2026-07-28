-- ============================================================================
-- 025_task_create_proposal.sql
--
-- Owner decision, 2026-07-28: "AI authored task can reach clients but only
-- after a human has reviewed and approved it."
--
-- Until now a task's title could reach a customer two ways, and only one was
-- gated. `update_task` REFUSES to set a title (022 added propose_task_update
-- for that), but `create_task` set the same column with no approval at all —
-- so the gate was bypassed by creating a task instead of renaming one. An
-- adversarial review found it while reviewing the external agent surface,
-- where an unattended third-party agent would have inherited the hole.
--
-- The split now matches the one 022 established:
--   create_task          write   — internal only, and the tool refuses a
--                                  case_id, because tasks_select_client keys
--                                  on exactly that column.
--   propose_task_create  propose — a task ON a case, which the customer sees
--                                  on their own case page. Approved first.
-- ============================================================================

ALTER TABLE public.ai_proposals DROP CONSTRAINT IF EXISTS ai_proposals_proposal_type_check;

ALTER TABLE public.ai_proposals ADD CONSTRAINT ai_proposals_proposal_type_check
  CHECK (proposal_type IN (
    'case_assessment',
    'draft_reply',
    'status_change',
    'checklist_update',
    'question',
    'case_update',
    'task_update',
    'task_create'
  ));
