-- ============================================================================
-- 019_ai_runs_cache_tokens.sql   (applied live as "ai_runs_cache_tokens")
--
-- The cost ledger was blind to prompt-cache tokens.
--
-- The provider bills cached input in its own buckets — writes at 1.25x the
-- input price, reads at 0.1x — and reports them in separate usage fields the
-- provider wrapper used to discard. For chat, the cacheable rulebook digest is
-- MOST of each request's input, so the ledger recorded roughly 5% of real chat
-- input spend while pricing every run "successfully": the unpriced-runs
-- safeguard never fired because nothing was unpriced, just wrong. The
-- knowledge-base analysis pipeline caches its corpus the same way.
--
-- ai_runs now stores both counts, cost_estimate_cents is computed from all
-- four buckets at record time, and ai_usage_daily folds cache tokens into the
-- input sum so the dashboard reports tokens the provider actually billed.
-- ============================================================================

ALTER TABLE public.ai_runs
  ADD COLUMN IF NOT EXISTS cache_write_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER;

COMMENT ON COLUMN public.ai_runs.cache_write_tokens IS
  'Prompt-cache creation tokens (billed at 1.25x input price). Separate from input_tokens.';
COMMENT ON COLUMN public.ai_runs.cache_read_tokens IS
  'Prompt-cache read tokens (billed at 0.1x input price). Separate from input_tokens.';

DROP FUNCTION IF EXISTS public.ai_usage_daily(integer);

CREATE FUNCTION public.ai_usage_daily(p_days integer DEFAULT 30)
RETURNS TABLE (
  day            date,
  ai_profile_id  uuid,
  run_type       text,
  runs           bigint,
  errors         bigint,
  unpriced_runs  bigint,
  input_tokens   bigint,
  output_tokens  bigint,
  cost_cents     numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (r.created_at AT TIME ZONE 'Europe/Amsterdam')::date        AS day,
    r.ai_profile_id,
    r.run_type,
    count(*)::bigint                                            AS runs,
    count(*) FILTER (WHERE r.status = 'error')::bigint           AS errors,
    count(*) FILTER (WHERE r.cost_estimate_cents IS NULL)::bigint AS unpriced_runs,
    -- Input INCLUDES cache tokens: the question the dashboard answers is "how
    -- many tokens did the provider bill us for", not "how many dodged the
    -- cache". Cost is not derived from this — it is computed per-run at record
    -- time from the four separate buckets.
    coalesce(sum(
      coalesce(r.input_tokens, 0)
      + coalesce(r.cache_write_tokens, 0)
      + coalesce(r.cache_read_tokens, 0)
    ), 0)::bigint                                                AS input_tokens,
    coalesce(sum(r.output_tokens), 0)::bigint                    AS output_tokens,
    coalesce(sum(r.cost_estimate_cents), 0)                      AS cost_cents
  FROM public.ai_runs r
  WHERE r.created_at >= (
    ((now() AT TIME ZONE 'Europe/Amsterdam')::date - (greatest(p_days, 1) - 1))::timestamp
      AT TIME ZONE 'Europe/Amsterdam'
  )
  GROUP BY 1, 2, 3
  ORDER BY 1 DESC;
$$;

REVOKE ALL ON FUNCTION public.ai_usage_daily(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ai_usage_daily(integer) FROM anon;
REVOKE ALL ON FUNCTION public.ai_usage_daily(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.ai_usage_daily(integer) TO service_role;
