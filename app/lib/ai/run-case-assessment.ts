import 'server-only';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { checkRateLimitStrict } from '@/app/lib/rate-limit';
import { resolveEmployeeProvider } from '@/app/lib/ai/provider-for-employee';
import { bibleSchema, type BibleRules } from '@/app/lib/ai/bible-schema';
import {
  caseAssessmentPayload,
  caseAssessmentJsonSchema,
} from '@/app/lib/ai/proposal-schemas';
import {
  buildCaseAssessmentSystem,
  buildCaseAssessmentUserText,
  relevantRulesets,
} from '@/app/lib/ai/prompts/case-assessment';
import { estimateCostCents } from '@/app/lib/ai/pricing';

export type RunResult =
  | { ok: true; proposalId: string }
  | { ok: false; code: 'ai_paused' | 'ai_budget_exceeded' | 'no_bible' | 'ai_unavailable' | 'case_not_found'; message: string };

/**
 * Assess one case with one AI employee, against the ACTIVE rulebook, and store
 * the result as a pending proposal. Never mutates the case: the output is a
 * proposal a human reviews.
 *
 * Guardrails run before any spend: the employee must exist and not be paused,
 * be within its daily budget (fail-closed), and there must be an active bible.
 */
export async function runCaseAssessment(
  aiProfileId: string,
  caseId: string,
): Promise<RunResult> {
  const admin = createAdminClient();

  const { data: config } = await admin
    .from('ai_employee_config')
    .select('job_description, max_runs_per_day, is_paused')
    .eq('profile_id', aiProfileId)
    .maybeSingle();
  if (!config) {
    return { ok: false, code: 'ai_unavailable', message: 'AI employee not found.' };
  }
  if (config.is_paused) {
    return { ok: false, code: 'ai_paused', message: 'This AI employee is paused.' };
  }

  // Daily budget — fail closed, so a limiter error blocks rather than allows
  // an unbounded spend.
  const withinBudget = await checkRateLimitStrict(
    `ai-run:${aiProfileId}`,
    config.max_runs_per_day,
    86400,
  );
  if (!withinBudget) {
    return {
      ok: false,
      code: 'ai_budget_exceeded',
      message: 'This AI employee has reached its daily run limit.',
    };
  }

  // Active rulebook.
  const { data: kbVersion } = await admin
    .from('kb_versions')
    .select('id, version, rules')
    .eq('status', 'active')
    .maybeSingle();
  if (!kbVersion) {
    return {
      ok: false,
      code: 'no_bible',
      message: 'There is no active rulebook. Activate a knowledge-base version first.',
    };
  }
  const parsedBible = bibleSchema.safeParse(kbVersion.rules);
  if (!parsedBible.success) {
    return { ok: false, code: 'no_bible', message: 'The active rulebook is not readable.' };
  }
  const bible: BibleRules = parsedBible.data;

  // Case context.
  const { data: caseRow } = await admin
    .from('cases')
    .select('id, title, case_type, status, description, municipality, client_id')
    .eq('id', caseId)
    .maybeSingle();
  if (!caseRow) {
    return { ok: false, code: 'case_not_found', message: 'Case not found.' };
  }

  const [{ data: checklist }, { data: documents }, { data: request }] = await Promise.all([
    admin.from('case_documents').select('id, name, status').eq('case_id', caseId).order('sort_order'),
    // Metadata only — file CONTENTS are deliberately not sent in v1.
    admin.from('documents').select('name, category').eq('case_id', caseId),
    admin
      .from('client_requests')
      .select('description')
      .eq('converted_to_case_id', caseId)
      .maybeSingle(),
  ]);

  const rulesets = relevantRulesets(bible, caseRow.case_type);

  // Resolve provider + run. Any provider/decrypt error becomes ai_unavailable.
  let provider;
  try {
    provider = await resolveEmployeeProvider(aiProfileId);
  } catch (err) {
    return {
      ok: false,
      code: 'ai_unavailable',
      message: err instanceof Error ? err.message : 'AI provider unavailable.',
    };
  }

  const system = buildCaseAssessmentSystem(config.job_description);
  const userText = buildCaseAssessmentUserText(
    {
      title: caseRow.title,
      caseType: caseRow.case_type,
      status: caseRow.status ?? 'intake',
      description: caseRow.description,
      municipality: caseRow.municipality,
      requestText: request?.description ?? null,
      checklist: ((checklist as { id: string; name: string; status: string }[]) || []).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      })),
      documents: ((documents as { name: string; category: string | null }[]) || []).map((d) => ({
        name: d.name,
        category: d.category,
      })),
    },
    rulesets,
  );

  let result;
  try {
    result = await provider.client.complete({
      model: provider.model,
      system,
      messages: [{ role: 'user', content: [{ type: 'text', text: userText }] }],
      maxTokens: 16000,
      jsonSchema: { name: 'case_assessment', schema: caseAssessmentJsonSchema() },
    });
  } catch (err) {
    await recordRun(admin, aiProfileId, provider.providerName, provider.model, null, kbVersion.id, {
      status: 'error',
      error: err instanceof Error ? err.message : 'provider error',
    });
    return { ok: false, code: 'ai_unavailable', message: 'The AI provider call failed.' };
  }

  if (result.stopReason === 'refusal' || result.stopReason === 'max_tokens') {
    await recordRun(admin, aiProfileId, provider.providerName, result.model, null, kbVersion.id, {
      status: 'error',
      error: `stop_reason ${result.stopReason}`,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
    });
    return { ok: false, code: 'ai_unavailable', message: 'The AI could not complete the assessment.' };
  }

  let payload;
  try {
    payload = caseAssessmentPayload.parse(JSON.parse(result.text));
  } catch {
    await recordRun(admin, aiProfileId, provider.providerName, result.model, null, kbVersion.id, {
      status: 'error',
      error: 'payload validation failed',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
    });
    return { ok: false, code: 'ai_unavailable', message: 'The AI produced an unexpected result.' };
  }

  const title = `AI-beoordeling: ${caseRow.title}`;
  const { data: proposal, error: proposalError } = await admin
    .from('ai_proposals')
    .insert({
      ai_profile_id: aiProfileId,
      case_id: caseId,
      client_id: caseRow.client_id,
      proposal_type: 'case_assessment',
      title,
      payload,
      rationale: payload.summary_nl,
      kb_version_id: kbVersion.id,
      // Denormalised so a non-admin reviewer — who cannot read the admin-only
      // kb_versions table — can still see which rulebook this was judged against.
      kb_version_number: kbVersion.version,
      status: 'pending',
    })
    .select('id')
    .single();
  if (proposalError || !proposal) {
    return { ok: false, code: 'ai_unavailable', message: 'Could not save the assessment.' };
  }

  await recordRun(admin, aiProfileId, provider.providerName, result.model, proposal.id, kbVersion.id, {
    status: 'ok',
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: result.latencyMs,
  });

  // Attribution at creation: the AI is the actor.
  await admin.from('activity_log').insert({
    user_id: aiProfileId,
    action: 'ai_proposal_created',
    entity_type: 'ai_proposals',
    entity_id: proposal.id,
    details: { proposal_type: 'case_assessment', case_id: caseId, overall: payload.overall },
  });

  return { ok: true, proposalId: proposal.id };
}

type RunRecord = {
  status: 'ok' | 'error';
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
};

async function recordRun(
  admin: ReturnType<typeof createAdminClient>,
  aiProfileId: string,
  provider: string,
  model: string,
  proposalId: string | null,
  kbVersionId: string,
  record: RunRecord,
): Promise<void> {
  await admin.from('ai_runs').insert({
    ai_profile_id: aiProfileId,
    provider,
    model,
    run_type: 'case_assessment',
    proposal_id: proposalId,
    kb_version_id: kbVersionId,
    input_tokens: record.inputTokens ?? null,
    output_tokens: record.outputTokens ?? null,
    latency_ms: record.latencyMs ?? null,
    cost_estimate_cents:
      record.inputTokens != null && record.outputTokens != null
        ? estimateCostCents(model, record.inputTokens, record.outputTokens)
        : null,
    status: record.status,
    error: record.error ?? null,
  });
}
