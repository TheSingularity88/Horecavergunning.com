-- ============================================================================
-- 018_ai_chat.sql   (applied live as "ai_chat")
--
-- In-platform chat with AI employees. One shared thread per AI employee — the
-- AI is a colleague the whole team talks to, not a private assistant per
-- person — visible to all staff, like the review queue.
--
-- The security model does not move: chat REPLIES are text to staff, never an
-- action. Anything that would change a case still goes through ai_proposals
-- and a human approval. Writes are service-role only (the chat action inserts
-- both sides after its guards); role 'ai' remains outside is_staff(), so an AI
-- account cannot read its own thread through RLS either.
-- ============================================================================

-- 'chat' joins the run types so every chat reply lands in the same cost ledger
-- the monitoring dashboard reads.
ALTER TABLE public.ai_runs DROP CONSTRAINT IF EXISTS ai_runs_run_type_check;
ALTER TABLE public.ai_runs ADD CONSTRAINT ai_runs_run_type_check
  CHECK (run_type IN ('kb_analysis', 'case_assessment', 'draft_reply', 'question', 'chat'));

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author         TEXT NOT NULL CHECK (author IN ('staff', 'ai')),
  -- Staff rows: who wrote it. AI rows: who the AI was answering — kept so the
  -- thread reads correctly even after a staff account is deleted (SET NULL).
  staff_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A staff message must say which staff member wrote it.
  CONSTRAINT ai_messages_staff_attributed CHECK (author = 'ai' OR staff_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_thread
  ON public.ai_messages (ai_profile_id, created_at);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_messages_select_staff" ON public.ai_messages;
CREATE POLICY "ai_messages_select_staff" ON public.ai_messages
  FOR SELECT USING (public.is_staff());
-- No INSERT/UPDATE/DELETE policies: writes go through the guarded server
-- action with the service role, which is what attributes both sides correctly.
