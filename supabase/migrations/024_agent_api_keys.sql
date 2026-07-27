-- ============================================================================
-- 024_agent_api_keys.sql
--
-- Route 2, half one: keys the PLATFORM mints so an outside agent — a ChatGPT
-- Custom GPT, or Claude Code — can act as one of our external AI employees.
--
-- Direction matters, and this table is the opposite of ai_providers:
--   ai_providers.encrypted_key   OUTBOUND. AES-256-GCM, REVERSIBLE, because we
--                                must decrypt it to call Anthropic.
--   ai_api_keys.key_hash         INBOUND. sha256, ONE-WAY, never recoverable.
--                                We only ever need to recognise a key someone
--                                presents, never to reproduce it.
-- Both tables also carry a *_prefix column for display. They mean opposite
-- things. Do not merge these code paths.
--
-- Modelled on lost-and-found-v4's admin_api_tokens (the owner's stated
-- reference), copying its storage mechanics — hash-only, show-once, soft
-- revoke — and deliberately NOT copying four things:
--
--   1. THE TOKEN IS THE PRINCIPAL. v4's key authenticates as whichever ADMIN
--      minted it, and its fallbackAuthor() will even pick the oldest admin in
--      the table. Writes then land under a human who never made them. Here a
--      key belongs to an AI EMPLOYEE and acts as nobody else — which is the
--      whole point of the owner's "each AI employee is clearly marked".
--   2. MANDATORY EXPIRY. v4 has no expires_at, so a leaked key is immortal.
--   3. SCOPES. They mirror the tool tiers the internal AI already obeys —
--      read / write / propose — so a key can be narrower than the employee.
--   4. NO ENV BOOTSTRAP KEY. v4 accepts a token from ADMIN_API_TOKEN that is
--      invisible in the dashboard and unrevocable without a redeploy.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The principal. Not "who created it" — who it IS. Restrict rather than
  -- cascade: deleting an employee must not silently delete the audit trail of
  -- keys that acted as it.
  ai_profile_id UUID NOT NULL REFERENCES public.profiles(id),

  label TEXT NOT NULL,

  -- sha256 hex of the whole token. Unique across ALL rows including revoked
  -- ones, so a revoked key's hash can never be re-minted into a live key.
  key_hash TEXT NOT NULL UNIQUE,

  -- Display only, and CLEAN — no ellipsis baked in. v4 stored 'lafm_1a2b3c4…'
  -- with the ellipsis in the column, which made it unusable for narrowing a
  -- lookup or attributing a leaked key. The UI adds the ellipsis.
  key_prefix TEXT NOT NULL,

  -- Mirrors the tool tiers in app/lib/ai/tools/registry.ts. 'propose' is the
  -- only one that can produce customer-visible change, and even then only via
  -- the human approval queue.
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read', 'write', 'propose'],

  -- NOT NULL on purpose: no immortal keys. The UI defaults to 90 days.
  expires_at TIMESTAMPTZ NOT NULL,

  last_used_at TIMESTAMPTZ,
  last_used_ip TEXT,
  last_used_ua TEXT,
  request_count BIGINT NOT NULL DEFAULT 0,

  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- SET NULL, not the reference implementation's bare FK: there, deleting an
  -- admin who ever minted a key hard-fails on the constraint.
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- cardinality(), NOT array_length(). array_length('{}', 1) returns NULL rather
-- than 0, NULL >= 1 is NULL, and a CHECK is SATISFIED by NULL — so the obvious
-- spelling of this constraint accepted a key with no scopes at all. Probed and
-- confirmed before the fix: such a key authenticates and can then do nothing,
-- which is a malformed key the constraint claimed to prevent.
ALTER TABLE public.ai_api_keys DROP CONSTRAINT IF EXISTS ai_api_keys_scopes_valid;
ALTER TABLE public.ai_api_keys ADD CONSTRAINT ai_api_keys_scopes_valid
  CHECK (
    cardinality(scopes) >= 1
    AND scopes <@ ARRAY['read', 'write', 'propose']::TEXT[]
  );

-- A key with an expiry already in the past is a typo, not a policy.
ALTER TABLE public.ai_api_keys DROP CONSTRAINT IF EXISTS ai_api_keys_expiry_after_creation;
ALTER TABLE public.ai_api_keys ADD CONSTRAINT ai_api_keys_expiry_after_creation
  CHECK (expires_at > created_at);

-- The hot path: sha256 lookup among keys that are still live.
CREATE INDEX IF NOT EXISTS ai_api_keys_live_idx
  ON public.ai_api_keys (key_hash) WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS ai_api_keys_profile_idx
  ON public.ai_api_keys (ai_profile_id, created_at DESC);

-- Deny-all: RLS on, zero policies. Every read and write goes through a
-- service-role server action, exactly as ai_providers and ai_employee_config
-- already do. A key table must never be reachable from a browser session.
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_api_keys IS
  'Platform-minted INBOUND keys. A key acts AS its ai_profile_id, never as the admin who minted it. Hash is one-way; ai_providers.encrypted_key is the reversible OUTBOUND counterpart.';

-- ---------------------------------------------------------------------------
-- A key may only belong to an EXTERNAL employee
-- ---------------------------------------------------------------------------
--
-- A platform employee is one we call out to; it has no reason to call in, and
-- a key bound to one would be a second, unmarked way into the dashboard —
-- precisely the ambiguity migration 023 exists to remove. This cannot be a
-- CHECK because it spans tables.

CREATE OR REPLACE FUNCTION public.enforce_api_key_employee_is_external()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_type TEXT;
BEGIN
  SELECT p.role, c.employment_type INTO v_role, v_type
  FROM public.profiles p
  LEFT JOIN public.ai_employee_config c ON c.profile_id = p.id
  WHERE p.id = NEW.ai_profile_id;

  IF v_role IS DISTINCT FROM 'ai' THEN
    RAISE EXCEPTION 'An API key can only belong to an AI employee.';
  END IF;
  IF v_type IS DISTINCT FROM 'external' THEN
    RAISE EXCEPTION
      'An API key can only belong to an AI employee that works through its own API key (route 2). This one is %.',
      COALESCE(v_type, 'not configured');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_api_key_employee_is_external() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ai_api_keys_employee_is_external ON public.ai_api_keys;
CREATE TRIGGER ai_api_keys_employee_is_external
  BEFORE INSERT OR UPDATE OF ai_profile_id ON public.ai_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.enforce_api_key_employee_is_external();

-- ---------------------------------------------------------------------------
-- The secret is write-once
-- ---------------------------------------------------------------------------
--
-- Nothing legitimate ever rewrites a hash or a prefix: a key is minted once,
-- used, and revoked. Allowing an UPDATE would let a bug or a compromised
-- service-role path silently swap the secret behind an existing label and its
-- whole usage history.

CREATE OR REPLACE FUNCTION public.reject_api_key_secret_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.key_hash IS DISTINCT FROM OLD.key_hash
     OR NEW.key_prefix IS DISTINCT FROM OLD.key_prefix THEN
    RAISE EXCEPTION 'An API key secret cannot be changed. Revoke this key and mint a new one.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_api_key_secret_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ai_api_keys_secret_immutable ON public.ai_api_keys;
CREATE TRIGGER ai_api_keys_secret_immutable
  BEFORE UPDATE OF key_hash, key_prefix ON public.ai_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.reject_api_key_secret_change();

-- ---------------------------------------------------------------------------
-- Usage stamping, in one atomic statement
-- ---------------------------------------------------------------------------
--
-- request_count counts REQUESTS and is incremented every time. The first
-- version of this incremented it inside a once-a-minute throttle in application
-- code, so it silently counted active MINUTES: a key driven at its 60/min
-- ceiling reported 60 requests per hour instead of 3600, understating a
-- hammered key by up to 60x on the one screen an admin has for spotting a
-- leaked one. It was also a read-modify-write across three round trips, so
-- concurrent requests overwrote each other's increment.
--
-- last_used_* is the low-value, high-cost half and stays throttled — a minute
-- of resolution is plenty for "when did this key last work".

CREATE OR REPLACE FUNCTION public.touch_agent_api_key(
  p_id UUID,
  p_ip TEXT,
  p_ua TEXT,
  p_stale_seconds INTEGER
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ai_api_keys
  SET
    request_count = request_count + 1,
    last_used_at = CASE
      WHEN last_used_at IS NULL OR last_used_at < now() - make_interval(secs => p_stale_seconds)
      THEN now() ELSE last_used_at END,
    last_used_ip = CASE
      WHEN last_used_at IS NULL OR last_used_at < now() - make_interval(secs => p_stale_seconds)
      THEN p_ip ELSE last_used_ip END,
    last_used_ua = CASE
      WHEN last_used_at IS NULL OR last_used_at < now() - make_interval(secs => p_stale_seconds)
      THEN p_ua ELSE last_used_ua END
  WHERE id = p_id;
$$;

-- Service role only. Exposed as an RPC it would let anyone inflate a key's
-- usage figures, which is the one thing this table is watched for.
REVOKE ALL ON FUNCTION public.touch_agent_api_key(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_agent_api_key(UUID, TEXT, TEXT, INTEGER) TO service_role;
