'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { runHistoryQuerySchema } from '@/app/lib/validation/ai-monitoring';

/**
 * Read-only monitoring of the AI system: what it ran, what it cost, how often a
 * human agreed with it, and how much daily budget is left.
 *
 * ADMIN ONLY — every export self-guards. `ai_runs` is admin-SELECT at RLS and
 * `rate_limits` is deny-all, so these numbers have no browser path except
 * through here.
 *
 * Nothing in this module writes. If you add a write, it does not belong here.
 */

/** How many days the "month" window covers. Also the RPC's lookback. */
const WINDOW_DAYS = 30;

export interface AiUsageWindow {
  runs: number;
  errors: number;
  inputTokens: number;
  outputTokens: number;
  /** Estimated spend in euro cents. Not a billing source of truth. */
  costCents: number;
  /**
   * Runs whose model had no price entry, so `costCents` excludes them. Shown
   * next to the figure — an incomplete total presented as a complete one is
   * worse than no total.
   */
  unpricedRuns: number;
}

export interface AiEmployeeUsage {
  profileId: string;
  fullName: string;
  isPaused: boolean;
  maxRunsPerDay: number;
  /** Slots consumed in the limiter's current 24h window, capped at the max. */
  budgetUsed: number;
  /** Attempts refused after the budget ran out (the limiter counts those too). */
  blockedAttempts: number;
  /** When the current limiter window rolls over, or null if none is open. */
  budgetResetsAt: string | null;
  today: AiUsageWindow;
  week: AiUsageWindow;
  month: AiUsageWindow;
}

export interface AiProposalStats {
  pending: number;
  approved: number;
  rejected: number;
  /**
   * Answered `question` proposals. Counted separately because answering one
   * sets status='approved' — folding those into the approval rate would mean
   * the more questions the AI asked, the better it appeared to score.
   */
  questionsAnswered: number;
  /** approved / (approved + rejected), questions excluded. Null until decided. */
  approvalRate: number | null;
}

export interface AiMonitoringData {
  totals: { today: AiUsageWindow; week: AiUsageWindow; month: AiUsageWindow };
  byRunType: { runType: string; runs: number; errors: number; costCents: number }[];
  employees: AiEmployeeUsage[];
  proposals: AiProposalStats;
  windowDays: number;
}

export interface AiRunRow {
  id: string;
  createdAt: string;
  aiName: string | null;
  runType: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  costCents: number | null;
  status: 'ok' | 'error';
  error: string | null;
  proposalId: string | null;
}

interface DailyRow {
  day: string;
  ai_profile_id: string | null;
  run_type: string;
  runs: number;
  errors: number;
  unpriced_runs: number;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
}

const emptyWindow = (): AiUsageWindow => ({
  runs: 0,
  errors: 0,
  inputTokens: 0,
  outputTokens: 0,
  costCents: 0,
  unpricedRuns: 0,
});

function addTo(target: AiUsageWindow, row: DailyRow): void {
  target.runs += Number(row.runs);
  target.errors += Number(row.errors);
  target.inputTokens += Number(row.input_tokens);
  target.outputTokens += Number(row.output_tokens);
  target.costCents += Number(row.cost_cents);
  target.unpricedRuns += Number(row.unpriced_runs);
}

/**
 * "Today" and "7 days ago" as Amsterdam calendar dates, so the buckets line up
 * with the day boundaries the RPC grouped on. Doing this in UTC would put the
 * first two hours of every Dutch day into yesterday.
 */
function amsterdamDayKeys(): { today: string; weekStart: string } {
  // en-CA formats as YYYY-MM-DD, which sorts and compares as a plain string —
  // the same shape the RPC returns.
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  // Step back six calendar days from an anchor at MIDDAY UTC. Subtracting
  // 6 × 24h from the current instant instead would drift by an hour across a
  // DST change and, just after midnight, silently turn the 7-day window into
  // an 8-day one. Midday is far enough from both boundaries that a ±1h shift
  // can never move the date.
  const anchor = new Date(`${today}T12:00:00Z`);
  const weekStart = new Date(anchor.getTime() - 6 * 86_400_000).toISOString().slice(0, 10);

  return { today, weekStart };
}

export async function getAiMonitoring(): Promise<ActionResult<AiMonitoringData>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    // Proposal figures are exact COUNTS, not a fetched array. PostgREST caps
    // rows per request (1000 by default) and the service role is not exempt —
    // fetching every proposal to tally statuses would quietly start under-
    // reporting once the table grew, showing "0 awaiting review" while real
    // work sat unreviewed. That is the same trap migration 017 exists to avoid.
    //
    // `question` proposals are excluded from approved/rejected: answering one
    // sets status='approved' as its normal success path, so counting them would
    // make the AI look better the more questions it asked.
    const countPending = admin
      .from('ai_proposals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .neq('proposal_type', 'question');
    const countApproved = admin
      .from('ai_proposals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .neq('proposal_type', 'question');
    const countRejected = admin
      .from('ai_proposals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .neq('proposal_type', 'question');
    const countQuestions = admin
      .from('ai_proposals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('proposal_type', 'question');

    const [
      dailyResult,
      employeesResult,
      configsResult,
      limiterRows,
      pendingResult,
      approvedResult,
      rejectedResult,
      questionsResult,
    ] = await Promise.all([
      admin.rpc('ai_usage_daily', { p_days: WINDOW_DAYS }),
      admin.from('profiles').select('id, full_name').eq('role', 'ai'),
      admin.from('ai_employee_config').select('profile_id, max_runs_per_day, is_paused'),
      admin.from('rate_limits').select('key, count, window_start').like('key', 'ai-run:%'),
      countPending,
      countApproved,
      countRejected,
      countQuestions,
    ]);

    // Every query, not just the rollup. supabase-js RESOLVES a failed query with
    // `{data: null, error}` — it does not throw — so an unchecked failure used
    // to coalesce to `[]` and render as a confident zero. The worst case was the
    // limiter read: "0 / 20 used, no limit reached" while every run was in fact
    // being refused for exceeding the budget.
    for (const [name, result] of Object.entries({
      usage: dailyResult,
      employees: employeesResult,
      configs: configsResult,
      limiter: limiterRows,
      pending: pendingResult,
      approved: approvedResult,
      rejected: rejectedResult,
      questions: questionsResult,
    })) {
      if (result.error) {
        console.error(`[ai-monitoring] ${name} query failed:`, result.error);
        return { success: false, error: 'Could not load the AI monitoring figures.' };
      }
    }

    const daily = (dailyResult.data as DailyRow[]) || [];
    const { today, weekStart } = amsterdamDayKeys();

    const totals = { today: emptyWindow(), week: emptyWindow(), month: emptyWindow() };
    const perEmployee = new Map<
      string,
      { today: AiUsageWindow; week: AiUsageWindow; month: AiUsageWindow }
    >();
    const perRunType = new Map<string, { runs: number; errors: number; costCents: number }>();

    for (const row of daily) {
      const day = String(row.day).slice(0, 10);

      addTo(totals.month, row);
      if (day >= weekStart) addTo(totals.week, row);
      if (day === today) addTo(totals.today, row);

      // Platform-level work (the knowledge-base analysis) carries no
      // ai_profile_id: it belongs in the totals, but under no employee.
      if (row.ai_profile_id) {
        let bucket = perEmployee.get(row.ai_profile_id);
        if (!bucket) {
          bucket = { today: emptyWindow(), week: emptyWindow(), month: emptyWindow() };
          perEmployee.set(row.ai_profile_id, bucket);
        }
        addTo(bucket.month, row);
        if (day >= weekStart) addTo(bucket.week, row);
        if (day === today) addTo(bucket.today, row);
      }

      const typeBucket = perRunType.get(row.run_type) ?? { runs: 0, errors: 0, costCents: 0 };
      typeBucket.runs += Number(row.runs);
      typeBucket.errors += Number(row.errors);
      typeBucket.costCents += Number(row.cost_cents);
      perRunType.set(row.run_type, typeBucket);
    }

    // Limiter state, so "why is this employee refusing to run" is answerable.
    const limiterByProfile = new Map<string, { count: number; windowStart: string }>();
    for (const row of (limiterRows.data as { key: string; count: number; window_start: string }[]) ||
      []) {
      limiterByProfile.set(row.key.replace(/^ai-run:/, ''), {
        count: row.count,
        windowStart: row.window_start,
      });
    }

    const configByProfile = new Map(
      (
        (configsResult.data as
          | { profile_id: string; max_runs_per_day: number; is_paused: boolean }[]
          | null) || []
      ).map((c) => [c.profile_id, c]),
    );

    const employees: AiEmployeeUsage[] = (
      (employeesResult.data as { id: string; full_name: string }[] | null) || []
    ).map((profile) => {
      const usage = perEmployee.get(profile.id);
      const config = configByProfile.get(profile.id);
      const limiter = limiterByProfile.get(profile.id);

      // check_rate_limit resets its window lazily on the next call, so a window
      // that already expired still holds a stale count. Report it as spent.
      const maxRunsPerDay = config?.max_runs_per_day ?? 0;
      let budgetUsed = 0;
      let blockedAttempts = 0;
      let budgetResetsAt: string | null = null;
      if (limiter) {
        const resets = new Date(new Date(limiter.windowStart).getTime() + 86_400_000);
        if (resets.getTime() > Date.now()) {
          // The limiter increments FIRST and compares after, so refused attempts
          // bump the counter too. Showing it raw rendered "45 / 20 used" next to
          // "20 runs today" — two numbers claiming to count the same work and
          // disagreeing. Cap the consumed figure and report the overflow for
          // what it is: attempts that were turned away.
          budgetUsed = maxRunsPerDay > 0 ? Math.min(limiter.count, maxRunsPerDay) : limiter.count;
          blockedAttempts = maxRunsPerDay > 0 ? Math.max(0, limiter.count - maxRunsPerDay) : 0;
          budgetResetsAt = resets.toISOString();
        }
      }

      return {
        profileId: profile.id,
        fullName: profile.full_name,
        isPaused: config?.is_paused ?? false,
        maxRunsPerDay,
        budgetUsed,
        blockedAttempts,
        budgetResetsAt,
        today: usage?.today ?? emptyWindow(),
        week: usage?.week ?? emptyWindow(),
        month: usage?.month ?? emptyWindow(),
      };
    });

    const approved = approvedResult.count ?? 0;
    const rejected = rejectedResult.count ?? 0;
    const decided = approved + rejected;

    return {
      success: true,
      data: {
        totals,
        byRunType: [...perRunType.entries()]
          .map(([runType, v]) => ({ runType, ...v }))
          .sort((a, b) => b.runs - a.runs),
        employees,
        proposals: {
          pending: pendingResult.count ?? 0,
          approved,
          rejected,
          questionsAnswered: questionsResult.count ?? 0,
          approvalRate: decided > 0 ? approved / decided : null,
        },
        windowDays: WINDOW_DAYS,
      },
    };
  } catch (err) {
    return toActionError(err);
  }
}

const PAGE_SIZE = 25;

/** One page of run history, newest first. */
export async function getAiRunHistory(
  input: unknown,
): Promise<ActionResult<{ rows: AiRunRow[]; total: number; pageSize: number }>> {
  try {
    await requireAdmin();
    const parsed = runHistoryQuerySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' };
    }
    const { page, aiProfileId, status } = parsed.data;

    const admin = createAdminClient();
    let query = admin
      .from('ai_runs')
      .select(
        'id, created_at, run_type, provider, model, input_tokens, output_tokens, latency_ms, cost_estimate_cents, status, error, proposal_id, ai_profile_id, profiles:ai_profile_id(full_name)',
        { count: 'exact' },
      );

    if (aiProfileId) query = query.eq('ai_profile_id', aiProfileId);
    if (status) query = query.eq('status', status);

    const from = page * PAGE_SIZE;
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('[ai-monitoring] run history failed:', error);
      return { success: false, error: 'Could not load the run history.' };
    }

    type Raw = {
      id: string;
      created_at: string;
      run_type: string;
      provider: string;
      model: string;
      input_tokens: number | null;
      output_tokens: number | null;
      latency_ms: number | null;
      cost_estimate_cents: number | null;
      status: 'ok' | 'error';
      error: string | null;
      proposal_id: string | null;
      profiles: { full_name: string } | null;
    };

    return {
      success: true,
      data: {
        rows: ((data as unknown as Raw[]) || []).map((r) => ({
          id: r.id,
          createdAt: r.created_at,
          aiName: r.profiles?.full_name ?? null,
          runType: r.run_type,
          provider: r.provider,
          model: r.model,
          inputTokens: r.input_tokens,
          outputTokens: r.output_tokens,
          latencyMs: r.latency_ms,
          costCents: r.cost_estimate_cents === null ? null : Number(r.cost_estimate_cents),
          status: r.status,
          error: r.error,
          proposalId: r.proposal_id,
        })),
        total: count ?? 0,
        pageSize: PAGE_SIZE,
      },
    };
  } catch (err) {
    return toActionError(err);
  }
}
