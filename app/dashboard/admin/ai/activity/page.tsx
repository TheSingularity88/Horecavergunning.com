'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gauge,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  getAiMonitoring,
  getAiRunHistory,
  type AiMonitoringData,
  type AiRunRow,
  type AiUsageWindow,
} from '@/app/lib/actions/ai-monitoring';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Select } from '@/app/components/ui/Select';
import { Spinner } from '@/app/components/ui/Spinner';
import { useToast } from '@/app/components/ui/Toast';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';

/**
 * What the AI system actually did, what it cost, and how often a human agreed
 * with it.
 *
 * The approval rate is the number that matters most: it is the only direct
 * measure of whether the AI is worth keeping, and it is only meaningful because
 * a human reviews every proposal. A high rate does not mean the AI should be
 * trusted unreviewed — it means the reviewing is going quickly.
 */

/**
 * Not read from `t`: keeping it out of the loaders' dependency arrays stops a
 * language switch from re-issuing the run-history query, which is expensive
 * (an exact count) and entirely language-independent.
 */
const NETWORK_ERROR = 'Could not reach the server. Reload the page and try again.';
export default function AiActivityPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { showError } = useToast();
  const m = t.dashboard?.aiActivity;

  const [data, setData] = useState<AiMonitoringData | null>(null);
  const [runs, setRuns] = useState<AiRunRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/dashboard');
  }, [authLoading, isAdmin, router]);

  // A failed load must not look like "nothing has happened yet". Both loaders
  // record WHY they failed so the page can say so and offer a retry, instead of
  // rendering an empty state that reads as a fact about the AI system.
  const loadSummary = useCallback(async () => {
    try {
      const result = await getAiMonitoring();
      if (result.success && result.data) {
        setData(result.data);
        setSummaryError(null);
      } else if (!result.success) {
        setSummaryError(result.error);
        showError(result.error);
      }
    } catch {
      // A deploy can invalidate an already-loaded page's action id, and a
      // dropped connection rejects too. Without the finally the spinner
      // covering this whole page never went away.
      setSummaryError(NETWORK_ERROR);
      showError(NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const loadRuns = useCallback(async () => {
    setIsLoadingRuns(true);
    try {
      const result = await getAiRunHistory({
        page,
        aiProfileId: employeeFilter || undefined,
        status: statusFilter || undefined,
      });
      if (result.success && result.data) {
        setRuns(result.data.rows);
        setTotal(result.data.total);
        setPageSize(result.data.pageSize);
        setRunsError(null);
      } else if (!result.success) {
        // `page` has already advanced, so keeping the old rows would label
        // page 1's runs as page 2's.
        setRuns([]);
        setRunsError(result.error);
        showError(result.error);
      }
    } catch {
      setRuns([]);
      setRunsError(NETWORK_ERROR);
      showError(NETWORK_ERROR);
    } finally {
      setIsLoadingRuns(false);
    }
  }, [page, employeeFilter, statusFilter, showError]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      await loadSummary();
    };
    load();
  }, [isAdmin, loadSummary]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      await loadRuns();
    };
    load();
  }, [isAdmin, loadRuns]);

  if (!isAdmin) return null;

  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  return (
    <DashboardPage title={m?.title || 'AI activity'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href={dashboardRoutes.employee.admin.ai}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {m?.backToAi || 'Back to AI employees'}
        </Link>

        <p className="mb-6 max-w-2xl text-sm text-slate-600">{m?.intro}</p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : summaryError ? (
          // Deliberately NOT the empty state: "no activity recorded yet" is a
          // claim about the AI system, and it must never be how a broken read
          // presents itself.
          <Card className="p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-600" />
            <p className="text-slate-700">{summaryError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={loadSummary}>
              {m?.retry || 'Try again'}
            </Button>
          </Card>
        ) : !data ? (
          <Card className="p-6 text-center text-slate-500">{m?.noData || 'No data yet.'}</Card>
        ) : (
          <div className="space-y-10">
            {/* Spend and volume */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Coins className="h-5 w-5 text-slate-500" />
                {m?.spendTitle || 'Usage and spend'}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <WindowCard label={m?.windowToday || 'Today'} window={data.totals.today} t={t} />
                <WindowCard label={m?.windowWeek || 'Last 7 days'} window={data.totals.week} t={t} />
                <WindowCard
                  label={(m?.windowMonth || 'Last {d} days').replace(
                    '{d}',
                    String(data.windowDays),
                  )}
                  window={data.totals.month}
                  t={t}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{m?.costDisclaimer}</p>
            </section>

            {/* Human review outcomes */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-slate-500" />
                {m?.reviewTitle || 'Human review'}
              </h2>
              <Card className="p-4">
                <div className="grid gap-4 sm:grid-cols-5">
                  <Stat
                    label={m?.proposalsPending || 'Awaiting review'}
                    value={String(data.proposals.pending)}
                    highlight={data.proposals.pending > 0}
                  />
                  <Stat
                    label={m?.proposalsApproved || 'Approved'}
                    value={String(data.proposals.approved)}
                  />
                  <Stat
                    label={m?.proposalsRejected || 'Rejected'}
                    value={String(data.proposals.rejected)}
                  />
                  <Stat
                    label={m?.questionsAnswered || 'Questions answered'}
                    value={String(data.proposals.questionsAnswered)}
                  />
                  <Stat
                    label={m?.approvalRate || 'Approval rate'}
                    value={
                      data.proposals.approvalRate === null
                        ? '—'
                        : `${Math.round(data.proposals.approvalRate * 100)}%`
                    }
                    hint={m?.approvalRateHint}
                  />
                </div>
                {data.proposals.pending > 0 && (
                  <Link
                    href={dashboardRoutes.employee.aiReview}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    {m?.goToReview || 'Go to the review queue'}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </Card>
            </section>

            {/* Per employee */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Gauge className="h-5 w-5 text-slate-500" />
                {m?.perEmployeeTitle || 'Per AI employee'}
              </h2>
              {data.employees.length === 0 ? (
                <Card className="p-6 text-center text-slate-500">
                  {m?.noEmployees || 'No AI employees yet.'}
                </Card>
              ) : (
                <div className="space-y-2">
                  {data.employees.map((employee) => {
                    const budgetLeft = Math.max(0, employee.maxRunsPerDay - employee.budgetUsed);
                    const budgetSpent =
                      employee.maxRunsPerDay > 0 && budgetLeft === 0 && employee.budgetUsed > 0;
                    return (
                      <Card key={employee.profileId} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{employee.fullName}</span>
                          {employee.isPaused && (
                            <Badge variant="warning">{t.dashboard?.ai?.pausedBadge || 'Paused'}</Badge>
                          )}
                          {budgetSpent && (
                            <Badge variant="error">{m?.budgetSpent || 'Daily limit reached'}</Badge>
                          )}
                        </div>
                        <div className="mt-3 grid gap-4 sm:grid-cols-4">
                          <Stat
                            label={m?.budgetUsed || 'Daily budget used'}
                            value={`${employee.budgetUsed} / ${employee.maxRunsPerDay}`}
                            hint={[
                              employee.budgetResetsAt
                                ? (m?.resetsAt || 'resets {t}').replace(
                                    '{t}',
                                    formatTime(employee.budgetResetsAt),
                                  )
                                : null,
                              employee.blockedAttempts > 0
                                ? (m?.blockedAttempts || '{n} further attempts refused').replace(
                                    '{n}',
                                    String(employee.blockedAttempts),
                                  )
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || undefined}
                          />
                          <Stat
                            label={m?.runsToday || 'Runs today'}
                            value={String(employee.today.runs)}
                          />
                          <Stat
                            label={m?.errorsWindow || 'Errors (30d)'}
                            value={String(employee.month.errors)}
                            highlight={employee.month.errors > 0}
                          />
                          <Stat
                            label={m?.costWindow || 'Spend (30d)'}
                            value={formatEuro(employee.month.costCents)}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Run history */}
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Activity className="h-5 w-5 text-slate-500" />
                  {m?.historyTitle || 'Run history'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={employeeFilter}
                    onChange={(e) => {
                      setEmployeeFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-auto"
                    options={[
                      { value: '', label: m?.allEmployees || 'All AI employees' },
                      ...data.employees.map((employee) => ({
                        value: employee.profileId,
                        label: employee.fullName,
                      })),
                    ]}
                  />
                  <Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-auto"
                    options={[
                      { value: '', label: m?.allStatuses || 'All outcomes' },
                      { value: 'ok', label: m?.statusOk || 'Succeeded' },
                      { value: 'error', label: m?.statusError || 'Failed' },
                    ]}
                  />
                </div>
              </div>

              {isLoadingRuns ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : runsError ? (
                <Card className="p-6 text-center">
                  <p className="text-slate-700">{runsError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={loadRuns}>
                    {m?.retry || 'Try again'}
                  </Button>
                </Card>
              ) : runs.length === 0 ? (
                <Card className="p-6 text-center text-slate-500">
                  {m?.noRuns || 'No runs recorded yet.'}
                </Card>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[52rem] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500">
                          <th className="py-2 pr-3 font-medium">{m?.colWhen || 'When'}</th>
                          <th className="py-2 pr-3 font-medium">{m?.colWho || 'AI employee'}</th>
                          <th className="py-2 pr-3 font-medium">{m?.colType || 'Type'}</th>
                          <th className="py-2 pr-3 font-medium">{m?.colModel || 'Model'}</th>
                          <th className="py-2 pr-3 text-right font-medium">
                            {m?.colTokens || 'Tokens'}
                          </th>
                          <th className="py-2 pr-3 text-right font-medium">
                            {m?.colLatency || 'Time'}
                          </th>
                          <th className="py-2 pr-3 text-right font-medium">
                            {m?.colCost || 'Cost'}
                          </th>
                          <th className="py-2 font-medium">{m?.colResult || 'Result'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runs.map((run) => (
                          <tr key={run.id} className="border-b border-slate-100 align-top">
                            <td className="py-2 pr-3 whitespace-nowrap text-slate-600">
                              {formatDateTime(run.createdAt)}
                            </td>
                            <td className="py-2 pr-3 text-slate-900">
                              {run.aiName ?? (m?.platformRun || 'Platform')}
                            </td>
                            <td className="py-2 pr-3 text-slate-600">
                              {t.dashboard?.enums?.aiRunType?.[
                                run.runType as keyof typeof t.dashboard.enums.aiRunType
                              ] || run.runType.replace(/_/g, ' ')}
                            </td>
                            <td className="py-2 pr-3 font-mono text-xs text-slate-500">
                              {run.model}
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-600">
                              {run.inputTokens === null && run.outputTokens === null
                                ? '—'
                                : `${(run.inputTokens ?? 0).toLocaleString('nl-NL')} / ${(
                                    run.outputTokens ?? 0
                                  ).toLocaleString('nl-NL')}`}
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-600">
                              {run.latencyMs === null ? '—' : `${(run.latencyMs / 1000).toFixed(1)}s`}
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-600">
                              {run.costCents === null ? '—' : formatEuro(run.costCents)}
                            </td>
                            <td className="py-2">
                              {run.status === 'ok' ? (
                                <Badge variant="success">{m?.statusOk || 'Succeeded'}</Badge>
                              ) : (
                                <div className="flex items-start gap-1.5">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                  <span className="text-red-700">
                                    {run.error || m?.statusError || 'Failed'}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                    <span>
                      {(m?.pageOf || 'Page {p} of {n} · {total} runs')
                        .replace('{p}', String(page + 1))
                        .replace('{n}', String(lastPage + 1))
                        .replace('{total}', String(total))}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {m?.previous || 'Previous'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= lastPage}
                        onClick={() => setPage((p) => p + 1)}
                        className="gap-1"
                      >
                        {m?.next || 'Next'}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </DashboardPage>
  );
}

/** Euro cents (possibly fractional) as a euro amount. */
function formatEuro(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

function WindowCard({
  label,
  window: w,
  t,
}: {
  label: string;
  window: AiUsageWindow;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const m = t.dashboard?.aiActivity;
  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{formatEuro(w.costCents)}</p>
      {/* An incomplete total shown as a complete one is worse than no total. */}
      {w.unpricedRuns > 0 && (
        <p className="mt-0.5 text-xs text-amber-700">
          {(m?.unpricedRuns || '{n} run(s) not priced').replace('{n}', String(w.unpricedRuns))}
        </p>
      )}
      <p className="mt-1 text-sm text-slate-500">
        {w.runs} {m?.runsLabel || 'runs'}
        {w.errors > 0 && (
          <span className="text-red-600">
            {' · '}
            {w.errors} {m?.errorsLabel || 'failed'}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">
        {(w.inputTokens + w.outputTokens).toLocaleString('nl-NL')} {m?.tokensLabel || 'tokens'}
      </p>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={
          highlight
            ? 'mt-0.5 text-lg font-semibold text-amber-700'
            : 'mt-0.5 text-lg font-semibold text-slate-900'
        }
      >
        {value}
      </p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
