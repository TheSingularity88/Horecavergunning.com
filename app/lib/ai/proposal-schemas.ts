import { z } from 'zod';
import { CASE_STATUSES } from '@/app/lib/actions/cases';

/**
 * Per-type payload schemas for ai_proposals.payload.
 *
 * These are the contract between what an AI produces and what a human approval
 * is allowed to execute. The payload is validated TWICE: once when the run
 * engine stores the proposal, and again inside approveProposal before any
 * mutation runs — the model's output is data, never trusted code, and the
 * execution switch re-parses rather than trusting the stored blob.
 *
 * No 'server-only': the review UI renders typed payloads client-side.
 */

// ---- case_assessment: the flagship v1 output. Advisory — approving it does
//      not itself change the case; a human reads it and acts. -----------------
const criterionResult = z.strictObject({
  criterion_id: z.string(),
  question_nl: z.string(),
  verdict: z.enum(['pass', 'fail', 'unclear', 'not_applicable']),
  severity: z.enum(['blocking', 'advisory']),
  explanation_nl: z.string(),
});

const checklistFinding = z.strictObject({
  item_id: z.string().nullable(),
  label_nl: z.string(),
  status: z.enum(['present', 'missing', 'incomplete', 'unclear']),
  note_nl: z.string().nullable(),
});

export const caseAssessmentPayload = z.strictObject({
  overall: z.enum(['ready', 'needs_work', 'blocked', 'insufficient_info']),
  summary_nl: z.string(),
  checklist_findings: z.array(checklistFinding),
  criteria_results: z.array(criterionResult),
  risks_nl: z.array(z.string()),
  recommended_next_step_nl: z.string(),
});

// ---- draft_reply: copy-only in v1. Approving marks it approved; a human
//      copies it into email/portal themselves. No auto-send. --------------------
export const draftReplyPayload = z.strictObject({
  subject_nl: z.string(),
  body_nl: z.string(),
});

// ---- status_change: the one that actually mutates a case on approval, and so
//      the most tightly bounded. -------------------------------------------------
export const statusChangePayload = z.strictObject({
  to_status: z.enum(CASE_STATUSES),
  reason_nl: z.string(),
});

// ---- checklist_update: mark checklist items on approval. -----------------------
export const checklistUpdatePayload = z.strictObject({
  updates: z
    .array(
      z.strictObject({
        case_document_id: z.string().uuid(),
        // Only staff-side states an AI may propose; approval writes these.
        status: z.enum(['in_review', 'approved', 'rejected']),
        note_nl: z.string().nullable(),
      }),
    )
    .min(1)
    .max(50),
});

// ---- question: the AI asks a human; the human answers in review_note. ----------
export const questionPayload = z.strictObject({
  question_nl: z.string(),
  context_nl: z.string().nullable(),
});

export type CaseAssessmentPayload = z.infer<typeof caseAssessmentPayload>;
export type DraftReplyPayload = z.infer<typeof draftReplyPayload>;
export type StatusChangePayload = z.infer<typeof statusChangePayload>;
export type ChecklistUpdatePayload = z.infer<typeof checklistUpdatePayload>;
export type QuestionPayload = z.infer<typeof questionPayload>;

/** Validate a stored payload against its type. Returns typed data or an error. */
export function parseProposalPayload(
  type: string,
  payload: unknown,
):
  | { ok: true; type: 'case_assessment'; data: CaseAssessmentPayload }
  | { ok: true; type: 'draft_reply'; data: DraftReplyPayload }
  | { ok: true; type: 'status_change'; data: StatusChangePayload }
  | { ok: true; type: 'checklist_update'; data: ChecklistUpdatePayload }
  | { ok: true; type: 'question'; data: QuestionPayload }
  | { ok: false; error: string } {
  switch (type) {
    case 'case_assessment': {
      const r = caseAssessmentPayload.safeParse(payload);
      return r.success
        ? { ok: true, type, data: r.data }
        : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid payload' };
    }
    case 'draft_reply': {
      const r = draftReplyPayload.safeParse(payload);
      return r.success
        ? { ok: true, type, data: r.data }
        : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid payload' };
    }
    case 'status_change': {
      const r = statusChangePayload.safeParse(payload);
      return r.success
        ? { ok: true, type, data: r.data }
        : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid payload' };
    }
    case 'checklist_update': {
      const r = checklistUpdatePayload.safeParse(payload);
      return r.success
        ? { ok: true, type, data: r.data }
        : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid payload' };
    }
    case 'question': {
      const r = questionPayload.safeParse(payload);
      return r.success
        ? { ok: true, type, data: r.data }
        : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid payload' };
    }
    default:
      return { ok: false, error: `Unknown proposal type: ${type}` };
  }
}

/** JSON Schema for the case-assessment payload, sent to the provider. */
export function caseAssessmentJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(caseAssessmentPayload) as Record<string, unknown>;
}
