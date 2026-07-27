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

    // Resolve which AI employee runs.
    //
    // Only a PLATFORM employee can do this: a case assessment is US calling a
    // model, and an external employee has no provider key here to call with.
    // Scoping to platform also keeps the no-chooser case working — the case
    // page calls this without an id, and before this the resolution counted
    // every active role='ai' profile, so creating the first external employee
    // would have broken the "Vraag AI-beoordeling" button for everyone with an
    // error the UI offers no way to answer.
    const { data: platformConfigs, error: configError } = await admin
      .from('ai_employee_config')
      .select('profile_id')
      .eq('employment_type', 'platform');
    // A failed read must not read as "you have no AI employees". supabase-js
    // resolves a failed query with { data: null, error }, and this set is the
    // membership test — coalescing it to empty would filter every employee out
    // and report a confident, wrong answer.
    if (configError) {
      console.error('[ai-run] employee config lookup failed:', configError.message);
      return { success: false, error: 'Could not check which AI employees are available.' };
    }
    const platformIds = new Set(
      ((platformConfigs as { profile_id: string }[]) || []).map((c) => c.profile_id),
    );

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
      if (!platformIds.has(aiProfileId)) {
        return {
          success: false,
          error: 'That AI employee works through its own API key and cannot be asked to assess a case from here.',
        };
      }
    } else {
      const { data: ais } = await admin
        .from('profiles')
        .select('id')
        .eq('role', 'ai')
        .eq('is_active', true);
      const active = (ais as { id: string }[]) || [];
      const list = active.filter((a) => platformIds.has(a.id));
      if (list.length === 0) {
        // Distinguish "none at all" from "only external ones". Saying nothing is
        // set up when an employee plainly exists in the admin screen sends the
        // reader looking for a configuration problem that is not there.
        return {
          success: false,
          error: active.length
            ? 'Your AI employees all work through their own API key. Assessing a case from here needs an employee on our provider key.'
            : 'No AI employees are set up yet.',
        };
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
