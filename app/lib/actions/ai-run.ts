'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { requestAssessmentSchema } from '@/app/lib/validation/ai-review';
import { runCaseAssessment } from '@/app/lib/ai/run-case-assessment';

/**
 * Staff-triggered: ask an AI employee to assess a case. Self-guards
 * requireStaff — every 'use server' export is a callable endpoint. The result
 * lands as a pending proposal in the review queue; this action never changes
 * the case.
 */
export async function requestCaseAssessment(
  input: unknown,
): Promise<ActionResult<{ proposalId: string }>> {
  try {
    await requireStaff();
    const parsed = requestAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid request.' };
    }

    const admin = createAdminClient();

    // Resolve which AI employee runs. Given one, verify it is an active AI.
    // Given none, require exactly one active AI so the choice is unambiguous.
    let aiProfileId = parsed.data.aiProfileId;
    if (aiProfileId) {
      const { data: ai } = await admin
        .from('profiles')
        .select('id')
        .eq('id', aiProfileId)
        .eq('role', 'ai')
        .eq('is_active', true)
        .maybeSingle();
      if (!ai) return { success: false, error: 'That AI employee is not available.' };
    } else {
      const { data: ais } = await admin
        .from('profiles')
        .select('id')
        .eq('role', 'ai')
        .eq('is_active', true);
      const list = (ais as { id: string }[]) || [];
      if (list.length === 0) {
        return { success: false, error: 'No AI employees are set up yet.' };
      }
      if (list.length > 1) {
        return { success: false, error: 'Choose which AI employee should assess this case.' };
      }
      aiProfileId = list[0].id;
    }

    const result = await runCaseAssessment(aiProfileId, parsed.data.caseId);
    if (!result.ok) {
      const code =
        result.code === 'ai_paused'
          ? 'ai_paused'
          : result.code === 'ai_budget_exceeded'
            ? 'ai_budget_exceeded'
            : 'ai_unavailable';
      return { success: false, error: result.message, code };
    }

    return { success: true, data: { proposalId: result.proposalId } };
  } catch (err) {
    return toActionError(err);
  }
}
