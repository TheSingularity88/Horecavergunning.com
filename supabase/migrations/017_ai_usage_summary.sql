-- ============================================================================
-- 017_ai_usage_summary.sql   (applied live as "ai_usage_summary")
--
-- Aggregation for the AI monitoring dashboard.
--
-- PostgREST cannot GROUP BY, so the alternative was pulling every ai_runs row
-- into the server action and summing in TypeScript. That works at ten runs a
-- day and quietly stops working later; this returns one row per
-- (day, employee, run type) instead — a few hundred rows for a month regardless
-- of how busy the system gets — and the action rolls those into the
-- today / 7-day / 30-day figures the page shows.
--
-- "Today" means today in AMSTERDAM, not UTC. Between midnight and 02:00 CEST
-- the two disagree, and an owner looking at "spend today" at 01:00 means the
-- day they are living in.
--
-- SECURITY DEFINER because ai_runs is admin-only at RLS and this is called from
-- an admin-guarded server action through the service-role client. EXECUTE is
-- revoked from anon and authenticated: there is no browser path to it at all,
-- by design — the numbers reach the page through the guarded action.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ai_usage_daily(p_days integer DEFAULT 30)
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
    -- sum() skips NULLs, so a run we could not price silently contributes 0.
    -- Counting them lets the page say "€ 4,20 (2 runs unpriced)" instead of
    -- presenting a partial total as if it were the whole bill.
    count(*) FILTER (WHERE r.cost_estimate_cents IS NULL)::bigint AS unpriced_runs,
    coalesce(sum(r.input_tokens), 0)::bigint                     AS input_tokens,
    coalesce(sum(r.output_tokens), 0)::bigint                    AS output_tokens,
    coalesce(sum(r.cost_estimate_cents), 0)                      AS cost_cents
  FROM public.ai_runs r
  -- Whole Amsterdam days, NOT `now() - 30 days`.
  --
  -- A rolling instant boundary combined with calendar-day grouping makes the
  -- oldest bucket a partial day whose size depends on the time of the request:
  -- open the page at 09:00 and refresh at 17:00 with no new activity, and the
  -- "last 30 days" figure DROPS. A spend number that shrinks on refresh is how
  -- you teach an owner to distrust the dashboard. This also keeps the month
  -- window on the same basis as the 7-day one, so today ⊆ week ⊆ month holds.
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

-- The run history is read newest-first and filtered per employee, which the
-- existing (ai_profile_id, created_at) index cannot serve for the unfiltered
-- "everything, newest first" view.
CREATE INDEX IF NOT EXISTS idx_ai_runs_created_at
  ON public.ai_runs (created_at DESC);

-- ---------------------------------------------------------------------------
-- Tidy-up from 016: the trigger function was reachable as an RPC
-- ---------------------------------------------------------------------------

-- Postgres grants EXECUTE on new functions to PUBLIC by default, so
-- reject_ai_task_assignee() showed up at /rest/v1/rpc/... for anon and
-- authenticated. Calling it there fails anyway ("trigger functions can only be
-- called as triggers"), but an endpoint that exists only to error is one more
-- thing on the attack surface to reason about. Firing a trigger does not check
-- EXECUTE on its function, so revoking changes nothing about enforcement.
REVOKE ALL ON FUNCTION public.reject_ai_task_assignee() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_ai_task_assignee() FROM anon;
REVOKE ALL ON FUNCTION public.reject_ai_task_assignee() FROM authenticated;
