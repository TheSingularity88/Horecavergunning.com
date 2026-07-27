-- ============================================================================
-- 022_task_update_proposal.sql
--
-- Lets an AI PROPOSE renaming a task or marking it done.
--
-- These were direct writes until an adversarial review traced where they land:
-- `tasks_select_client` (002_security_fixes.sql) grants a customer SELECT on
-- every task attached to their own case, and app/client/cases/[id]/page.tsx
-- prints task.title verbatim and colours a status badge from task.status.
--
-- So an AI marking a task "completed" painted a green "Voltooid" badge on the
-- customer's own progress view, and an AI editing a title put unreviewed model
-- prose in front of them — with no human in the loop. That is the exact failure
-- the checklist tool had, and the file that shipped it claimed in its own header
-- that "a task is internal by construction". It is not.
--
-- Internal planning fields (priority, due_date, description, assigned_to) stay
-- a direct write: no portal renders them.
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
    'task_update'
  ));
