'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { createClient } from '@/app/lib/supabase/client';
import { approveProposal, rejectProposal, answerQuestion } from '@/app/lib/actions/ai-review';
import { parseProposalPayload, type CaseAssessmentPayload } from '@/app/lib/ai/proposal-schemas';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Textarea } from '@/app/components/ui/Textarea';
import { Modal, ConfirmModal } from '@/app/components/ui/Modal';
import { Spinner } from '@/app/components/ui/Spinner';
import { useToast } from '@/app/components/ui/Toast';
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { AiProposal } from '@/app/lib/types/database';

/**
 * The human control point. Every AI output arrives here as a pending proposal;
 * nothing it contains has touched a case or a customer. A staff member reads
 * it, then approves (which executes the one mapped action) or rejects.
 */

type ProposalWithMeta = AiProposal & {
  profiles?: { full_name: string } | null;
  cases?: { title: string } | null;
};

export default function AiReviewPage() {
  const { t } = useLanguage();
  const { showError } = useToast();
  const r = t.dashboard?.aiReview;

  const [proposals, setProposals] = useState<ProposalWithMeta[]>([]);
  const [tab, setTab] = useState<'pending' | 'handled'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [viewing, setViewing] = useState<ProposalWithMeta | null>(null);
  const [pendingApprove, setPendingApprove] = useState<ProposalWithMeta | null>(null);
  const [pendingReject, setPendingReject] = useState<ProposalWithMeta | null>(null);
  const [note, setNote] = useState('');
  const [answerFor, setAnswerFor] = useState<ProposalWithMeta | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isActing, setIsActing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  // Which rulebook is live right now. Comes from an RPC rather than a join
  // because kb_versions itself is admin-only — the rules are confidential, the
  // version number is not.
  const [activeKbVersion, setActiveKbVersion] = useState<number | null>(null);
  const supabase = useMemo(() => createClient(), []);

  /**
   * Filtering happens in the DATABASE, not in this component.
   *
   * Fetching the 200 newest rows of every status and filtering here looks
   * equivalent, but proposals are never deleted — only their status changes.
   * Once 200 handled proposals accumulate, the oldest pending ones fall off the
   * end of the page and the queue quietly renders "no open proposals" while
   * real work sits unreviewed. That is the one thing this screen must never do.
   *
   * The pending count is a separate exact count for the same reason. Migration
   * 014 ships a partial index on (created_at) WHERE status = 'pending', so both
   * are cheap.
   */
  const fetchProposals = useCallback(async () => {
    const base = supabase
      .from('ai_proposals')
      .select('*, profiles:ai_profile_id(full_name), cases:case_id(title)');

    const [listResult, countResult, versionResult] = await Promise.all([
      (tab === 'pending' ? base.eq('status', 'pending') : base.neq('status', 'pending'))
        // Open items read oldest-first: it is a queue, and the thing waiting
        // longest is the thing most likely to be overdue.
        .order('created_at', { ascending: tab === 'pending' })
        .limit(200),
      supabase
        .from('ai_proposals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Refreshed with the list, not once per mount: an admin can activate a
      // new rulebook while this page is open, and a pinned value would then
      // brand fresh assessments "no longer active" and stale ones current.
      supabase.rpc('active_kb_version'),
    ]);

    setProposals((listResult.data as ProposalWithMeta[]) || []);
    setPendingCount(countResult.count ?? 0);
    setActiveKbVersion(
      typeof versionResult.data === 'number' ? versionResult.data : null,
    );
    setIsLoading(false);
  }, [supabase, tab]);

  useEffect(() => {
    const load = async () => {
      await fetchProposals();
    };
    load();
  }, [fetchProposals]);

  const visible = proposals;

  /**
   * Run one review action and always return the screen to a usable state.
   *
   * The try/finally is not decoration: a server action rejects on transport
   * failures too — a deploy invalidates an already-loaded page's action id, a
   * connection drops — and without it `isActing` latched on forever, silently
   * disabling every approve, reject and answer control until a reload.
   *
   * The list is refetched on every outcome, including failure, because the
   * likeliest failure is "someone else already reviewed this" and the reviewer
   * needs to see that immediately.
   */
  const runReviewAction = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    reset: () => void,
  ) => {
    setIsActing(true);
    try {
      const result = await action();
      if (!result.success) showError(result.error ?? 'Something went wrong.');
    } catch {
      showError(
        t.clientPortal?.errors?.network ||
          'Connection lost. Reload the page and check the queue.',
      );
    } finally {
      await fetchProposals();
      setIsActing(false);
      reset();
      setViewing(null);
    }
  };

  const performApprove = async () => {
    if (!pendingApprove) return;
    const id = pendingApprove.id;
    await runReviewAction(
      () => approveProposal({ proposalId: id, note: note || undefined }),
      () => {
        setPendingApprove(null);
        setNote('');
      },
    );
  };

  const performReject = async () => {
    if (!pendingReject) return;
    const id = pendingReject.id;
    await runReviewAction(
      () => rejectProposal({ proposalId: id, note: note || undefined }),
      () => {
        setPendingReject(null);
        setNote('');
      },
    );
  };

  const performAnswer = async () => {
    if (!answerFor) return;
    const id = answerFor.id;
    await runReviewAction(
      () => answerQuestion({ proposalId: id, answer: answerText }),
      () => {
        setAnswerFor(null);
        setAnswerText('');
      },
    );
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const overallBadge = (overall: string) => {
    switch (overall) {
      case 'ready':
        return { variant: 'success' as const, label: r?.overallReady || 'Looks complete' };
      case 'needs_work':
        return { variant: 'warning' as const, label: r?.overallNeedsWork || 'Needs work' };
      case 'blocked':
        return { variant: 'error' as const, label: r?.overallBlocked || 'Blocked' };
      default:
        return { variant: 'default' as const, label: r?.overallInsufficient || 'Not enough info' };
    }
  };

  return (
    <DashboardPage title={r?.title || 'AI proposals'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-6 max-w-2xl text-sm text-slate-600">{r?.intro}</p>

        <div className="mb-4 flex gap-2">
          <Button
            variant={tab === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('pending')}
          >
            {r?.tabPending || 'Open'}
            {pendingCount > 0 && ` (${pendingCount})`}
          </Button>
          <Button
            variant={tab === 'handled' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('handled')}
          >
            {r?.tabHandled || 'Handled'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : visible.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">
              {tab === 'pending' ? r?.empty : r?.emptyHandled}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map((proposal) => {
              const parsed = parseProposalPayload(proposal.proposal_type, proposal.payload);
              const assessment =
                parsed.ok && parsed.type === 'case_assessment' ? parsed.data : null;
              const badge = assessment ? overallBadge(assessment.overall) : null;
              // Only flag as stale once we actually know the active version —
              // an unknown active version must not read as "outdated".
              const staleRulebook =
                proposal.kb_version_number != null &&
                activeKbVersion != null &&
                proposal.kb_version_number !== activeKbVersion;

              return (
                <Card key={proposal.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{proposal.title}</span>
                        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                        <Badge variant="default">{proposal.proposal_type.replace(/_/g, ' ')}</Badge>
                        {proposal.status !== 'pending' && (
                          <Badge variant={proposal.status === 'approved' ? 'success' : 'default'}>
                            {proposal.status}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {r?.byAi || 'by'} {proposal.profiles?.full_name ?? 'AI'} ·{' '}
                        {formatDate(proposal.created_at)}
                        {proposal.kb_version_number != null && (
                          <>
                            {' · '}
                            {(r?.assessedAgainst || 'rulebook v{v}').replace(
                              '{v}',
                              String(proposal.kb_version_number),
                            )}
                            {staleRulebook && (
                              <span className="text-amber-700">
                                {' '}
                                ({r?.staleRulebook || 'no longer active'})
                              </span>
                            )}
                          </>
                        )}
                      </p>
                      {proposal.rationale && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {proposal.rationale}
                        </p>
                      )}
                      {proposal.case_id && (
                        <Link
                          href={`${dashboardRoutes.employee.cases}/${proposal.case_id}`}
                          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                          {proposal.cases?.title ?? 'Case'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewing(proposal)}>
                        {r?.viewProposal || 'View'}
                      </Button>
                      {proposal.status === 'pending' &&
                        (proposal.proposal_type === 'question' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAnswerFor(proposal);
                              setAnswerText('');
                            }}
                          >
                            {r?.answer || 'Answer'}
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setPendingApprove(proposal);
                                setNote('');
                              }}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                              {r?.approve || 'Approve'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPendingReject(proposal);
                                setNote('');
                              }}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                              {r?.reject || 'Reject'}
                            </Button>
                          </>
                        ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Full proposal viewer */}
      <Modal
        isOpen={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ''}
        size="xl"
      >
        {viewing && <ProposalDetail proposal={viewing} />}
      </Modal>

      {/* Answer a question */}
      <Modal
        isOpen={answerFor !== null}
        onClose={() => setAnswerFor(null)}
        title={answerFor?.title ?? ''}
      >
        <div className="space-y-4">
          {answerFor && <ProposalDetail proposal={answerFor} compact />}
          <Textarea
            label={r?.answerLabel || 'Your answer to the AI'}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setAnswerFor(null)}>
              {t.dashboard?.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={performAnswer} disabled={isActing || !answerText.trim()}>
              {isActing ? <Spinner size="sm" /> : r?.answer || 'Answer'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={pendingApprove !== null}
        onClose={() => setPendingApprove(null)}
        onConfirm={performApprove}
        isLoading={isActing}
        variant="default"
        title={r?.confirmApproveTitle || 'Approve this proposal?'}
        message={(r?.confirmApprove || '"{title}" will be approved.').replace(
          '{title}',
          pendingApprove?.title ?? '',
        )}
        confirmText={r?.approve || 'Approve'}
        cancelText={t.dashboard?.common?.cancel || 'Cancel'}
        loadingText={t.dashboard?.common?.loading || 'Loading...'}
      />

      <ConfirmModal
        isOpen={pendingReject !== null}
        onClose={() => setPendingReject(null)}
        onConfirm={performReject}
        isLoading={isActing}
        variant="danger"
        title={r?.confirmRejectTitle || 'Reject this proposal?'}
        message={(r?.confirmReject || '"{title}" will be rejected.').replace(
          '{title}',
          pendingReject?.title ?? '',
        )}
        confirmText={r?.reject || 'Reject'}
        cancelText={t.dashboard?.common?.cancel || 'Cancel'}
        loadingText={t.dashboard?.common?.loading || 'Loading...'}
      />
    </DashboardPage>
  );
}

/** Renders a proposal payload by type. Unknown/invalid payloads show raw JSON
 *  rather than nothing — a reviewer must always be able to see what they are
 *  deciding on. */
function ProposalDetail({
  proposal,
  compact = false,
}: {
  proposal: ProposalWithMeta;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const r = t.dashboard?.aiReview;
  const parsed = parseProposalPayload(proposal.proposal_type, proposal.payload);

  if (!parsed.ok) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{parsed.error}</p>
        <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">
          {JSON.stringify(proposal.payload, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-slate-700">{r?.aiDisclaimer}</p>
      </div>

      {parsed.type === 'case_assessment' && (
        <AssessmentView data={parsed.data} compact={compact} />
      )}

      {parsed.type === 'draft_reply' && (
        <div className="space-y-2">
          <p className="font-medium text-slate-900">{parsed.data.subject_nl}</p>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
            {parsed.data.body_nl}
          </pre>
        </div>
      )}

      {parsed.type === 'status_change' && (
        <div className="space-y-1 text-sm">
          <p className="font-medium text-slate-900">→ {parsed.data.to_status}</p>
          <p className="text-slate-600">{parsed.data.reason_nl}</p>
        </div>
      )}

      {parsed.type === 'checklist_update' && (
        <ul className="space-y-1 text-sm">
          {parsed.data.updates.map((u) => (
            <li key={u.case_document_id} className="text-slate-700">
              <span className="font-medium">{u.status}</span>
              {u.note_nl ? ` — ${u.note_nl}` : ''}
            </li>
          ))}
        </ul>
      )}

      {parsed.type === 'question' && (
        <div className="space-y-2">
          <p className="text-slate-900">{parsed.data.question_nl}</p>
          {parsed.data.context_nl && (
            <p className="text-sm text-slate-600">{parsed.data.context_nl}</p>
          )}
        </div>
      )}

      {/* A note on a PENDING proposal is not a review — it is the reason a
          previous approval failed to execute and was put back in the queue.
          Hiding it left the reviewer re-clicking an approval that could not
          work, with no explanation. */}
      {proposal.review_note && (
        <div
          className={
            proposal.status === 'pending'
              ? 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm'
              : 'border-t border-slate-100 pt-3 text-sm'
          }
        >
          <span
            className={
              proposal.status === 'pending'
                ? 'font-medium text-amber-900'
                : 'font-medium text-slate-900'
            }
          >
            {proposal.status === 'pending'
              ? r?.lastAttemptFailed || 'Previous attempt failed'
              : r?.reviewedBy || 'Reviewed'}
            :
          </span>{' '}
          <span className={proposal.status === 'pending' ? 'text-amber-800' : 'text-slate-600'}>
            {proposal.review_note}
          </span>
        </div>
      )}
    </div>
  );
}

function AssessmentView({
  data,
  compact,
}: {
  data: CaseAssessmentPayload;
  compact: boolean;
}) {
  const { t } = useLanguage();
  const r = t.dashboard?.aiReview;

  const verdictLabel = (v: string) =>
    v === 'pass'
      ? r?.verdictPass || 'meets'
      : v === 'fail'
        ? r?.verdictFail || 'does not meet'
        : v === 'unclear'
          ? r?.verdictUnclear || 'unclear'
          : r?.verdictNotApplicable || 'n/a';

  const statusLabel = (s: string) =>
    s === 'present'
      ? r?.statusPresent || 'present'
      : s === 'missing'
        ? r?.statusMissing || 'missing'
        : s === 'incomplete'
          ? r?.statusIncomplete || 'incomplete'
          : r?.statusUnclear || 'unclear';

  return (
    <div className="max-h-[60vh] space-y-5 overflow-y-auto">
      <section>
        <h4 className="text-sm font-semibold text-slate-900">{r?.summary || 'Summary'}</h4>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{data.summary_nl}</p>
      </section>

      {!compact && data.checklist_findings.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-slate-900">
            {r?.checklistFindings || 'Checklist'}
          </h4>
          <ul className="mt-1 space-y-1">
            {data.checklist_findings.map((f, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-2 text-sm">
                <Badge
                  variant={
                    f.status === 'present' ? 'success' : f.status === 'missing' ? 'error' : 'warning'
                  }
                >
                  {statusLabel(f.status)}
                </Badge>
                <span className="text-slate-800">{f.label_nl}</span>
                {f.note_nl && <span className="text-slate-500">— {f.note_nl}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!compact && data.criteria_results.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-slate-900">
            {r?.criteriaResults || 'Assessment criteria'}
          </h4>
          <ul className="mt-1 space-y-2">
            {data.criteria_results.map((c) => (
              <li key={c.criterion_id} className="text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Badge
                    variant={
                      c.verdict === 'pass' ? 'success' : c.verdict === 'fail' ? 'error' : 'warning'
                    }
                  >
                    {verdictLabel(c.verdict)}
                  </Badge>
                  {c.severity === 'blocking' && (
                    <Badge variant="error">{r?.blockingBadge || 'blocking'}</Badge>
                  )}
                  <span className="text-slate-800">{c.question_nl}</span>
                </div>
                <p className="mt-0.5 text-slate-600">{c.explanation_nl}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.risks_nl.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-slate-900">{r?.risks || 'Risks'}</h4>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-700">
            {data.risks_nl.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="text-sm font-semibold text-slate-900">
          {r?.nextStep || 'Recommended next step'}
        </h4>
        <p className="mt-1 text-sm text-slate-700">{data.recommended_next_step_nl}</p>
      </section>
    </div>
  );
}
