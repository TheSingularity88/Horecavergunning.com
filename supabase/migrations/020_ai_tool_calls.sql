-- ============================================================================
-- 020_ai_tool_calls.sql   (applied live as "ai_tool_calls")
--
-- Every tool an AI employee runs, recorded.
--
-- The AI can now read the dashboard and do reversible internal work — create a
-- task, tick a checklist item — without asking first. That is only acceptable
-- if it is inspectable afterwards: which employee, on whose instruction, what
-- arguments, what came back, and whether it worked.
--
-- `access` is stored per call rather than looked up from the code, so the
-- record still says what tier a tool was in on the day it ran, even after the
-- registry changes.
--
-- Customer-visible actions are NOT in here as actions — they enter ai_proposals
-- as pending proposals and appear here only as "the AI filed a proposal".
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_tool_calls (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Whose instruction this was carried out under. Kept on delete so the audit
  -- trail survives staff turnover.
  staff_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tool_name      TEXT NOT NULL,
  access         TEXT NOT NULL CHECK (access IN ('read', 'write', 'propose')),
  input          JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Trimmed by the caller: this is an audit record, not a result cache.
  result_summary TEXT,
  ok             BOOLEAN NOT NULL,
  error          TEXT,
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_recent
  ON public.ai_tool_calls (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_profile
  ON public.ai_tool_calls (ai_profile_id, created_at DESC);

ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;

-- Staff can see what the AI did — the point of an audit trail is that the
-- people working alongside it can read it. Writes are service-role only.
DROP POLICY IF EXISTS "ai_tool_calls_select_staff" ON public.ai_tool_calls;
CREATE POLICY "ai_tool_calls_select_staff" ON public.ai_tool_calls
  FOR SELECT USING (public.is_staff());

-- Tasks created by an AI employee: created_by points at the AI profile, which
-- is fine (it is a real profiles row and the FK holds), but assigned_to must
-- still never be an AI — migration 016's trigger already enforces that.
