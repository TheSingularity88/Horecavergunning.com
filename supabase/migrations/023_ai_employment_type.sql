-- ============================================================================
-- 023_ai_employment_type.sql
--
-- Marks WHICH ROUTE an AI employee works through.
--
--   'platform'  Route 1. We hold a provider key (ai_providers.encrypted_key)
--               and call the model on the employee's behalf. "Agent 1" is one.
--   'external'  Route 2. WE mint an API key and an outside agent — a ChatGPT
--               Custom GPT, or Claude Code / the Claude CLI — authenticates
--               with it and drives the employee dashboard over HTTP. It brings
--               its own model and its own subscription; we never call a
--               provider for it and hold no provider key for it.
--
-- Until now the only thing distinguishing an AI employee was profiles.role =
-- 'ai', a single undifferentiated value. provider_id was already nullable, so
-- an external employee was STORABLE — but NULL there means "not configured
-- yet" for a platform employee, so reading it as "external" would be inferring
-- the route rather than reading it. The owner asked for each AI employee to be
-- clearly marked; inference is not marking.
--
-- The marker goes on ai_employee_config, NOT on profiles.role. role='ai' is a
-- security boundary — is_staff()/is_admin() exclude it and the middleware
-- bounces it — and splitting it into two values would mean auditing every
-- guard that compares against it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- The marker itself
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_employee_config
  ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT 'platform';

ALTER TABLE public.ai_employee_config
  DROP CONSTRAINT IF EXISTS ai_employee_config_employment_type_check;
ALTER TABLE public.ai_employee_config
  ADD CONSTRAINT ai_employee_config_employment_type_check
  CHECK (employment_type IN ('platform', 'external'));

COMMENT ON COLUMN public.ai_employee_config.employment_type IS
  'platform = we hold the provider key and call the model. external = we mint an API key and an outside agent calls us.';

-- The route and the provider must agree. Without this the two can contradict
-- each other: an "external" employee carrying a provider_id would silently
-- consume our paid API quota, and a "platform" employee with no provider is a
-- broken account that only reveals itself on its first run.
ALTER TABLE public.ai_employee_config
  DROP CONSTRAINT IF EXISTS ai_employee_config_route_matches_provider;
ALTER TABLE public.ai_employee_config
  ADD CONSTRAINT ai_employee_config_route_matches_provider
  CHECK (
    (employment_type = 'platform' AND provider_id IS NOT NULL)
    OR
    (employment_type = 'external' AND provider_id IS NULL AND model IS NULL)
  );

-- ---------------------------------------------------------------------------
-- The route is fixed at creation
-- ---------------------------------------------------------------------------
--
-- Flipping an employee between routes would silently re-label everything it
-- ever produced: the proposals in the review queue, the runs in the cost
-- ledger, the tool calls in the audit trail. "Agent 1 filed this" would come to
-- mean something different than it did on the day a human approved it.
--
-- An employee does not change which route it works through. You create another.

CREATE OR REPLACE FUNCTION public.reject_employment_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.employment_type IS DISTINCT FROM OLD.employment_type THEN
    RAISE EXCEPTION
      'employment_type is fixed when the AI employee is created (tried % -> %). Create a new employee instead.',
      OLD.employment_type, NEW.employment_type;
  END IF;
  RETURN NEW;
END;
$$;

-- Not callable as an RPC: a trigger function exposed over PostgREST is an
-- endpoint nobody meant to publish.
REVOKE ALL ON FUNCTION public.reject_employment_type_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ai_employee_config_employment_type_immutable ON public.ai_employee_config;
CREATE TRIGGER ai_employee_config_employment_type_immutable
  BEFORE UPDATE OF employment_type ON public.ai_employee_config
  FOR EACH ROW EXECUTE FUNCTION public.reject_employment_type_change();

-- ---------------------------------------------------------------------------
-- Carry the route onto the artifacts, so history stays honest
-- ---------------------------------------------------------------------------
--
-- ai_employee_config is deny-all RLS (service role only), so a reviewer's
-- browser cannot join to it to find out where a proposal came from. This is the
-- same problem 015 solved for the rulebook version, and the same answer:
-- denormalise the provenance fact onto the row that needs it.
--
-- It matters most here. The review queue is where a human's approval turns AI
-- output into a customer-visible act, and "an outside Custom GPT proposed this"
-- is a materially different thing to approve than "our own model proposed this".

ALTER TABLE public.ai_proposals
  ADD COLUMN IF NOT EXISTS ai_employment_type TEXT;

ALTER TABLE public.ai_proposals
  DROP CONSTRAINT IF EXISTS ai_proposals_ai_employment_type_check;
ALTER TABLE public.ai_proposals
  ADD CONSTRAINT ai_proposals_ai_employment_type_check
  CHECK (ai_employment_type IS NULL OR ai_employment_type IN ('platform', 'external'));

COMMENT ON COLUMN public.ai_proposals.ai_employment_type IS
  'Which route produced this, captured at creation. Nullable: proposals predating 023, and any whose employee config was since deleted.';

-- Filled by the database, not by the six call sites that insert proposals
-- (three tools in registry.ts, two in dashboard-tools.ts, one in
-- run-case-assessment.ts) — and R4b-3 will add more over HTTP. A stamp that
-- every writer must remember is a stamp that will eventually be missing, and a
-- missing route on a proposal is indistinguishable from a pre-023 one.
CREATE OR REPLACE FUNCTION public.stamp_proposal_employment_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ai_employment_type IS NULL THEN
    SELECT employment_type INTO NEW.ai_employment_type
    FROM public.ai_employee_config
    WHERE profile_id = NEW.ai_profile_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stamp_proposal_employment_type() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ai_proposals_stamp_employment_type ON public.ai_proposals;
CREATE TRIGGER ai_proposals_stamp_employment_type
  BEFORE INSERT ON public.ai_proposals
  FOR EACH ROW EXECUTE FUNCTION public.stamp_proposal_employment_type();

-- Everything that exists today came from the platform route.
UPDATE public.ai_proposals p
SET ai_employment_type = c.employment_type
FROM public.ai_employee_config c
WHERE c.profile_id = p.ai_profile_id
  AND p.ai_employment_type IS NULL;
