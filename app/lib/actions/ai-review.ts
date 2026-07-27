'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import {
  reviewProposalSchema,
  answerQuestionSchema,
} from '@/app/lib/validation/ai-review';
import { parseProposalPayload } from '@/app/lib/ai/proposal-schemas';
import type { AiProposal } from '@/app/lib/types/database';
import type { Json } from '@/app/lib/types/supabase';

/**
 * Human review of AI proposals. This is the gate the whole design rests on:
 * an AI proposal changes nothing until a human approves it here, and the
 * execution is a CLOSED SWITCH per proposal type that re-validates the payload
 * before performing only the one mutation that type maps to. The model's
 * output is data, never trusted code.
 */

/** Atomically claim a pending proposal for the reviewer. */
async function claimPending(
  admin: ReturnType<typeof createAdminClient>,
  proposalId: string,
  reviewerId: string,
  newStatus: 'approved' | 'rejected',
  note: string | null,
): Promise<{ ok: true; proposal: AiProposal } | { ok: false; error: string; code?: string }> {
  const { data: claimed } = await admin
    .from('ai_proposals')
    .update({
      status: newStatus,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_note: note,
    })
    .eq('id', proposalId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (!claimed) {
    // Either gone or already reviewed. Distinguish for a useful message.
    const { data: exists } = await admin
      .from('ai_proposals')
      .select('id')
      .eq('id', proposalId)
      .maybeSingle();
    return exists
      ? { ok: false, error: 'This proposal has already been reviewed.', code: 'proposal_already_reviewed' }
      : { ok: false, error: 'Proposal not found.' };
  }
  return { ok: true, proposal: claimed as AiProposal };
}

/**
 * Approve a proposal and execute its mapped action. On any execution failure
 * the claim is reverted to pending with an error note, so a half-applied
 * approval never sticks.
 */
export async function approveProposal(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireStaff();
    const parsed = reviewProposalSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid request.' };

    const admin = createAdminClient();
    const claim = await claimPending(admin, parsed.data.proposalId, profile.id, 'approved', parsed.data.note ?? null);
    if (!claim.ok) return { success: false, error: claim.error, code: claim.code as never };
    const proposal = claim.proposal;

    // Re-validate the payload at execution time — never trust the stored blob.
    const parsedPayload = parseProposalPayload(proposal.proposal_type, proposal.payload);
    if (!parsedPayload.ok) {
      await revertToPending(admin, proposal.id, `payload invalid: ${parsedPayload.error}`);
      return { success: false, error: 'This proposal has an invalid payload and cannot be executed.' };
    }

    let executionResult: Record<string, Json> = {};

    try {
      switch (parsedPayload.type) {
        case 'case_assessment':
          // Advisory: approving records that a human accepted the assessment.
          // It changes nothing about the case — the human acts on it.
          executionResult = { kind: 'assessment_accepted', overall: parsedPayload.data.overall };
          break;

        case 'draft_reply':
          // Copy-only in v1: no email is sent. The human copies the text.
          executionResult = { kind: 'draft_accepted_copy_only' };
          break;

        case 'status_change': {
          if (!proposal.case_id) throw new Error('no case on proposal');
          // Silent status change — NO customer email. Keeps the invariant that
          // no customer communication originates from an AI action; if the
          // human wants to notify, they use the normal notifying control.
          const { data: updated, error } = await admin
            .from('cases')
            .update({ status: parsedPayload.data.to_status })
            .eq('id', proposal.case_id)
            .select('id')
            .maybeSingle();
          if (error || !updated) throw new Error('status update failed');
          executionResult = { kind: 'status_changed', to: parsedPayload.data.to_status };
          break;
        }

        case 'case_update': {
          if (!proposal.case_id) throw new Error('no case on proposal');
          // Only the fields the proposal actually names. A null means "clear
          // this", an absent key means "leave it alone" — so an AI proposing a
          // deadline cannot silently blank the municipality. Read from the
          // PARSED payload, not the stored blob: strictObject has already
          // rejected any key outside this list, so status (which belongs to
          // status_change and its transition rules) cannot appear here at all.
          const fields = parsedPayload.data;
          const patch: Record<string, string | null> = {};
          for (const key of [
            'title',
            'description',
            'municipality',
            'reference_number',
            'priority',
            'deadline',
          ] as const) {
            const value = fields[key];
            if (value !== undefined) patch[key] = value;
          }
          // Guard against a payload that names no field at all: an UPDATE with
          // an empty patch would report success while doing nothing.
          if (Object.keys(patch).length === 0) throw new Error('no fields to update');

          const { data: updated, error } = await admin
            .from('cases')
            .update(patch)
            .eq('id', proposal.case_id)
            .select('id')
            .maybeSingle();
          if (error || !updated) throw new Error('case update failed');
          executionResult = { kind: 'case_updated', fields: Object.keys(patch) };
          break;
        }

        case 'checklist_update': {
          if (!proposal.case_id) throw new Error('no case on proposal');
          // Bound every update to THIS case — a payload cannot touch another
          // case's checklist rows even if it names their ids.
          const ids = parsedPayload.data.updates.map((u) => u.case_document_id);
          const { data: owned } = await admin
            .from('case_documents')
            .select('id')
            .eq('case_id', proposal.case_id)
            .in('id', ids);
          const ownedSet = new Set(((owned as { id: string }[]) || []).map((r) => r.id));
          let applied = 0;
          for (const update of parsedPayload.data.updates) {
            if (!ownedSet.has(update.case_document_id)) continue;
            const { error } = await admin
              .from('case_documents')
              .update({
                status: update.status,
                reviewed_by: profile.id,
                reviewed_at: new Date().toISOString(),
                review_note: update.note_nl,
              })
              .eq('id', update.case_document_id)
              .eq('case_id', proposal.case_id);
            if (!error) applied += 1;
          }
          executionResult = { kind: 'checklist_updated', applied, requested: parsedPayload.data.updates.length };
          break;
        }

        case 'question':
          // A question is not "approved" into an action; steer the reviewer to
          // answer it instead. Keep whatever note was already on the row — this
          // is not a review, so it must not erase one.
          await revertToPending(admin, proposal.id, proposal.review_note);
          return { success: false, error: 'Answer this question instead of approving it.' };
      }
    } catch (err) {
      await revertToPending(admin, proposal.id, err instanceof Error ? err.message : 'execution failed');
      return { success: false, error: 'The approved action could not be executed. It is back in the queue.' };
    }

    await admin
      .from('ai_proposals')
      .update({ executed_at: new Date().toISOString(), execution_result: executionResult })
      .eq('id', proposal.id);

    // Dual attribution: the approver is the actor; the AI is named in details.
    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'ai_proposal_approved',
      entity_type: 'ai_proposals',
      entity_id: proposal.id,
      details: {
        ai_profile_id: proposal.ai_profile_id,
        proposal_type: proposal.proposal_type,
        execution: executionResult,
      },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Reject a proposal. Nothing is executed. */
export async function rejectProposal(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireStaff();
    const parsed = reviewProposalSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid request.' };

    const admin = createAdminClient();
    const claim = await claimPending(admin, parsed.data.proposalId, profile.id, 'rejected', parsed.data.note ?? null);
    if (!claim.ok) return { success: false, error: claim.error, code: claim.code as never };

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'ai_proposal_rejected',
      entity_type: 'ai_proposals',
      entity_id: claim.proposal.id,
      details: { ai_profile_id: claim.proposal.ai_profile_id, proposal_type: claim.proposal.proposal_type },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Answer a `question` proposal. The answer is stored in review_note and the
 * proposal is marked approved; the AI's next run on the same case includes it.
 */
export async function answerQuestion(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireStaff();
    const parsed = answerQuestionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' };
    }

    const admin = createAdminClient();

    // Only a pending question can be answered; atomic claim guards races.
    const { data: answered } = await admin
      .from('ai_proposals')
      .update({
        status: 'approved',
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        review_note: parsed.data.answer,
        executed_at: new Date().toISOString(),
        execution_result: { kind: 'question_answered' },
      })
      .eq('id', parsed.data.proposalId)
      .eq('status', 'pending')
      .eq('proposal_type', 'question')
      .select('id, ai_profile_id')
      .maybeSingle();

    if (!answered) {
      return { success: false, error: 'This question is not open for an answer.', code: 'proposal_already_reviewed' };
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'ai_question_answered',
      entity_type: 'ai_proposals',
      entity_id: (answered as { id: string }).id,
      details: { ai_profile_id: (answered as { ai_profile_id: string }).ai_profile_id },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

async function revertToPending(
  admin: ReturnType<typeof createAdminClient>,
  proposalId: string,
  errorNote: string | null,
): Promise<void> {
  await admin
    .from('ai_proposals')
    .update({
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      review_note: errorNote,
    })
    .eq('id', proposalId);
}
