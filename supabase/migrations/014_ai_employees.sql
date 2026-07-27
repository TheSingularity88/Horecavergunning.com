-- ============================================================================
-- 014_ai_employees.sql   (applied live as "ai_employees")
--
-- Phase B foundations: AI employee accounts, encrypted provider keys, and the
-- proposal/approval pipeline both AI routes converge on.
--
-- Security model in one paragraph: an AI employee is a real profiles row with
-- role='ai', so every action it takes is attributable through the existing
-- activity_log FK — but 'ai' is deliberately NOT added to is_staff()/is_admin()
-- and is not accepted by the dashboard middleware or the requireStaff guard.
-- An AI account therefore has NO browser session, NO RLS surface and NO admin
-- path; every AI action runs through service-role server code that writes
-- PROPOSALS, and a human approval executes them. Provider API keys are stored
-- AES-256-GCM encrypted (app-side, key in AI_KEY_ENCRYPTION_SECRET) in a
-- deny-all table only the service role reads.
-- ============================================================================

-- 1. Third role: 'ai'. The CHECK constraint name varies between environments,
--    so drop whichever constraint carries the role check, then recreate.
DO $$
DECLARE c TEXT;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.profiles'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%role%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('employee', 'admin', 'ai'));

-- is_staff()/is_admin() intentionally unchanged: 'ai' is not staff at the RLS
-- layer. Middleware (role employee|admin only) already bounces 'ai' sessions.

-- ----------------------------------------------------------------------------
-- 2. Provider API keys (Route 1). Deny-all RLS: service role only, like
--    rate_limits. encrypted_key format: v1:<iv b64>:<tag b64>:<ciphertext b64>.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'google')),
  label         TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,          -- first characters, display only
  default_model TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;  -- no policies: deny-all

-- ----------------------------------------------------------------------------
-- 3. Per-AI-employee configuration (1:1 with a role='ai' profile).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_employee_config (
  profile_id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id      UUID REFERENCES public.ai_providers(id),
  model            TEXT,                -- override; NULL = provider default
  job_description  TEXT NOT NULL,       -- becomes part of the system prompt
  max_runs_per_day INTEGER NOT NULL DEFAULT 20,
  is_paused        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_ai_employee_config_updated_at
  BEFORE UPDATE ON public.ai_employee_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.ai_employee_config ENABLE ROW LEVEL SECURITY;  -- deny-all

-- ----------------------------------------------------------------------------
-- 4. Proposals — the single convergence point of Route 1 (platform-run AI)
--    and Route 2 (external agents). AI writes proposals; humans execute.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_proposals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_profile_id  UUID NOT NULL REFERENCES public.profiles(id),
  case_id        UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  client_id      UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  proposal_type  TEXT NOT NULL CHECK (proposal_type IN
    ('case_assessment', 'draft_reply', 'status_change', 'checklist_update', 'question')),
  title          TEXT NOT NULL,
  payload        JSONB NOT NULL,        -- zod-validated per type, re-validated at execution
  rationale      TEXT,
  kb_version_id  UUID REFERENCES public.kb_versions(id),
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
  reviewed_by    UUID REFERENCES public.profiles(id),
  reviewed_at    TIMESTAMPTZ,
  review_note    TEXT,
  executed_at    TIMESTAMPTZ,
  execution_result JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_ai_proposals_updated_at
  BEFORE UPDATE ON public.ai_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_ai_proposals_pending
  ON public.ai_proposals (created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ai_proposals_case ON public.ai_proposals (case_id);

ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;

-- Humans review; writes stay service-role-only.
DROP POLICY IF EXISTS "ai_proposals_select_staff" ON public.ai_proposals;
CREATE POLICY "ai_proposals_select_staff" ON public.ai_proposals
  FOR SELECT USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- 5. Run/cost ledger. Token counts only — no prompt or response bodies.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_profile_id  UUID REFERENCES public.profiles(id),
  provider       TEXT NOT NULL,
  model          TEXT NOT NULL,
  run_type       TEXT NOT NULL CHECK (run_type IN
    ('kb_analysis', 'case_assessment', 'draft_reply', 'question')),
  proposal_id    UUID REFERENCES public.ai_proposals(id),
  kb_version_id  UUID REFERENCES public.kb_versions(id),
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  latency_ms     INTEGER,
  cost_estimate_cents NUMERIC(10, 4),
  status         TEXT NOT NULL CHECK (status IN ('ok', 'error')),
  error          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_profile ON public.ai_runs (ai_profile_id, created_at);

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_runs_select_admin" ON public.ai_runs;
CREATE POLICY "ai_runs_select_admin" ON public.ai_runs
  FOR SELECT USING (public.is_admin());
