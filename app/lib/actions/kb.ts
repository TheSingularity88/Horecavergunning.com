'use server';

import { z } from 'zod';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { checkRateLimit } from '@/app/lib/rate-limit';
import {
  insertKbDocumentSchema,
  updateKbDocumentFlagsSchema,
  kbDocumentIdSchema,
  kbVersionIdSchema,
} from '@/app/lib/validation/kb';
import { extractDocument, redactText } from '@/app/lib/ai/extract';
import { envAnthropicClient, type AiContentBlock } from '@/app/lib/ai/provider';
import {
  bibleSchema,
  rulesetSchema,
  rulesetJsonSchema,
  rulesetPlanSchema,
  rulesetPlanJsonSchema,
  bibleTailSchema,
  bibleTailJsonSchema,
  type BibleRuleset,
} from '@/app/lib/ai/bible-schema';
import { renderBibleMarkdown } from '@/app/lib/ai/render-bible';
import { estimateCostCents } from '@/app/lib/ai/pricing';
import {
  KB_ANALYSIS_PROMPT_VERSION,
  KB_ANALYSIS_SYSTEM,
  buildKbAnalysisUserText,
  buildRulesetPlanInstruction,
  buildRulesetInstruction,
  buildTailInstruction,
} from '@/app/lib/ai/prompts/kb-analysis';
import type { KbDocument } from '@/app/lib/types/database';

const KB_ANALYSIS_MODEL = 'claude-opus-5';

/**
 * Knowledge-base actions. ADMIN ONLY — every export self-guards, because every
 * export of a 'use server' module is a callable POST endpoint the moment
 * anything references it (see the note in billing.ts).
 *
 * The FILE BYTES never pass through these actions. The browser uploads
 * directly to the private 'kb' bucket under the admin's own session, where
 * storage RLS (migration 013) enforces is_admin() — so a compromised or
 * non-admin session cannot place objects there no matter what it calls here.
 * These actions only manage the registry rows, which keeps uploads clear of
 * the server-action body-size limit and matches how the rest of the app
 * uploads documents.
 */

/** Register a document row after the browser uploaded the file. */
export async function insertKbDocument(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();

    const parsed = insertKbDocumentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid input',
      };
    }
    const data = parsed.data;

    // The path must belong to the id being registered — otherwise a caller
    // could register doc A pointing at doc B's object and delete B through A.
    if (!data.storage_path.startsWith(`${data.id}/`)) {
      return { success: false, error: 'Storage path does not match the document id.' };
    }

    const admin = createAdminClient();

    // Verify the object actually exists in the bucket before recording it —
    // the row is the registry, and a registry entry for a missing file would
    // make every later analysis run fail confusingly.
    const { data: obj, error: statError } = await admin.storage
      .from('kb')
      .list(data.id, { limit: 1 });
    if (statError || !obj || obj.length === 0) {
      return { success: false, error: 'Uploaded file not found in storage.' };
    }

    const { error } = await admin.from('kb_documents').insert({
      id: data.id,
      filename: data.filename,
      storage_path: data.storage_path,
      mime_type: data.mime_type,
      file_size: data.file_size,
      sha256: data.sha256.toLowerCase(),
      uploaded_by: profile.id,
    });
    if (error) {
      return { success: false, error: 'Could not register the document.' };
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'kb_document_uploaded',
      entity_type: 'kb_documents',
      entity_id: data.id,
      details: { filename: data.filename, file_size: data.file_size },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Update the analysis flags on a document (notes, PII, redaction, images). */
export async function updateKbDocumentFlags(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();

    const parsed = updateKbDocumentFlagsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid input',
      };
    }
    const data = parsed.data;

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('kb_documents')
      .update({
        notes: data.notes,
        contains_pii: data.contains_pii,
        redaction_terms: data.redaction_terms,
        include_images: data.include_images,
      })
      .eq('id', data.id)
      .select('id')
      .maybeSingle();

    if (error) return { success: false, error: 'Could not save the document settings.' };
    if (!updated) return { success: false, error: 'Document not found.' };

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'kb_document_flags_updated',
      entity_type: 'kb_documents',
      entity_id: data.id,
      details: {
        contains_pii: data.contains_pii,
        redaction_term_count: data.redaction_terms.length,
        include_images: data.include_images,
      },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Delete a document: row first (authoritative), storage object second.
 * If storage cleanup fails we are left with an orphaned object in a private
 * admin-only bucket — recoverable noise. The other order risks destroying the
 * file while the registry row survives pointing at nothing.
 */
export async function deleteKbDocument(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();

    const parsed = kbDocumentIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid document id' };
    }

    const admin = createAdminClient();

    const { data: doc } = await admin
      .from('kb_documents')
      .select('id, filename, storage_path')
      .eq('id', parsed.data.id)
      .maybeSingle();
    if (!doc) return { success: false, error: 'Document not found.' };

    const { error: rowError } = await admin.from('kb_documents').delete().eq('id', doc.id);
    if (rowError) return { success: false, error: 'Could not delete the document.' };

    const { error: storageError } = await admin.storage.from('kb').remove([doc.storage_path]);
    if (storageError) {
      console.error('[kb] row deleted but storage cleanup failed:', storageError);
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'kb_document_deleted',
      entity_type: 'kb_documents',
      entity_id: doc.id,
      details: { filename: doc.filename },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

// ---------------------------------------------------------------------------
// Analysis pipeline
// ---------------------------------------------------------------------------

interface PreparedDocument {
  doc: KbDocument;
  text: string;
  images: { contentType: string; base64: string }[];
  warnings: string[];
  redactions: Record<string, number>;
  extractedSha256: string;
}

/**
 * Download, extract and redact every registered document. Shared by the
 * preview (what the admin inspects) and the real run (what actually goes to
 * the provider) so the preview can never diverge from reality.
 */
async function prepareCorpus(): Promise<PreparedDocument[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('kb_documents').select('*').order('filename');
  const docs = (data as KbDocument[]) || [];
  if (docs.length === 0) {
    throw new Error('No documents in the knowledge base.');
  }

  const prepared: PreparedDocument[] = [];
  for (const doc of docs) {
    const { data: blob, error } = await admin.storage.from('kb').download(doc.storage_path);
    if (error || !blob) {
      throw new Error(`Could not download "${doc.filename}" from storage.`);
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    const extracted = await extractDocument(buffer, doc.mime_type, doc.filename);
    const redacted = redactText(extracted.text, doc.redaction_terms);
    prepared.push({
      doc,
      text: redacted.text,
      images: doc.include_images ? extracted.images : [],
      warnings: extracted.warnings,
      redactions: redacted.applied,
      extractedSha256: extracted.sha256,
    });
  }
  return prepared;
}

export interface KbExtractionPreview {
  filename: string;
  characters: number;
  imageCount: number;
  imagesIncluded: boolean;
  redactions: Record<string, number>;
  warnings: string[];
  /** The EXACT text that would leave the platform, for inspection. */
  text: string;
}

/** "What leaves the platform" — the admin inspects this before analyzing. */
export async function previewKbExtraction(): Promise<
  ActionResult<{ documents: KbExtractionPreview[] }>
> {
  try {
    await requireAdmin();
    const prepared = await prepareCorpus();
    return {
      success: true,
      data: {
        documents: prepared.map((p) => ({
          filename: p.doc.filename,
          characters: p.text.length,
          imageCount: p.images.length,
          imagesIncluded: p.doc.include_images,
          redactions: p.redactions,
          warnings: p.warnings,
          text: p.text,
        })),
      },
    };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * The Analyze run: corpus -> provider -> validated bible -> new DRAFT version.
 * Nothing consumes a draft; activation is a separate, human decision.
 */
export async function runKbAnalysis(): Promise<ActionResult<{ versionId: string }>> {
  try {
    const { profile } = await requireAdmin();

    // One run at a time. A second click while a run is in flight would burn a
    // second (expensive) provider call for an identical result.
    const allowed = await checkRateLimit('kb:analyze', 1, 120);
    if (!allowed) {
      return {
        success: false,
        error: 'An analysis is already running. Please wait for it to finish.',
        code: 'kb_analysis_running',
      };
    }

    const admin = createAdminClient();
    const prepared = await prepareCorpus();

    const userContent: AiContentBlock[] = [
      {
        type: 'text',
        text: buildKbAnalysisUserText(
          prepared.map((p) => ({
            filename: p.doc.filename,
            text: p.text,
            notes: p.doc.notes,
          })),
        ),
        // Identical in every call of the pipeline, so cache it: the first call
        // pays full price for the corpus, the rest pay a fraction.
        cacheable: true,
      },
    ];
    for (const p of prepared) {
      for (const image of p.images) {
        if (image.contentType === 'image/png' || image.contentType === 'image/jpeg') {
          userContent.push({
            type: 'image',
            mediaType: image.contentType,
            base64: image.base64,
          });
        }
      }
    }


    const client = await envAnthropicClient();

    // Accumulated across every call in the pipeline, so the version row and the
    // cost ledger report the whole analysis rather than its last step.
    let totalInput = 0;
    let totalOutput = 0;
    let totalLatency = 0;
    let lastModel = KB_ANALYSIS_MODEL;

    /**
     * One structured call over the shared corpus.
     *
     * `cacheCorpus` is deliberately per-call. Measured against the live API:
     * the response schema is part of the cached prefix, so a call with a
     * different schema never hits an existing entry — it writes a new one at
     * 1.25x input price. Caching therefore pays only where the same schema
     * repeats, which is the per-ruleset loop (one write, then reads at a tenth
     * of the price). The single plan and tail calls would pay the write
     * surcharge for a hit that can never come, so they opt out.
     */
    const step = async (
      instruction: string,
      jsonSchema: Record<string, unknown>,
      name: string,
      cacheCorpus = false,
    ) => {
      const corpus = cacheCorpus
        ? userContent
        : userContent.map((b) => (b.type === 'text' ? { ...b, cacheable: false } : b));
      const res = await client.complete({
        model: KB_ANALYSIS_MODEL,
        system: KB_ANALYSIS_SYSTEM,
        messages: [
          { role: 'user', content: [...corpus, { type: 'text', text: instruction }] },
        ],
        maxTokens: 32000,
        jsonSchema: { name, schema: jsonSchema },
      });
      totalInput += res.inputTokens;
      totalOutput += res.outputTokens;
      totalLatency += res.latencyMs;
      lastModel = res.model;
      return res;
    };

    const failed = async (reason: string, message: string) => {
      console.error('[kb] analysis failed:', reason);
      await admin.from('activity_log').insert({
        user_id: profile.id,
        action: 'kb_analysis_failed',
        entity_type: 'kb_versions',
        entity_id: null,
        details: { reason: reason.slice(0, 500) },
      });
      await recordKbRun(
        admin,
        client.id,
        { model: lastModel, inputTokens: totalInput, outputTokens: totalOutput, latencyMs: totalLatency },
        { status: 'error', error: reason.slice(0, 500) },
      );
      return { success: false as const, error: message, code: 'ai_unavailable' as const };
    };

    // --- 1. Which rulesets should exist? -----------------------------------
    const planResult = await step(buildRulesetPlanInstruction(), rulesetPlanJsonSchema(), 'ruleset_plan');
    if (planResult.stopReason === 'refusal' || planResult.stopReason === 'max_tokens') {
      return failed(`plan stop_reason ${planResult.stopReason}`, 'The AI could not plan the rulebook. Please try again.');
    }
    const plan = safeParse(rulesetPlanSchema, planResult.text);
    if (!plan.ok) return failed(`plan: ${plan.error}`, 'The AI produced an unusable plan. Please try again.');
    if (plan.value.rulesets.length === 0) {
      return failed('plan contained no rulesets', 'The AI found no rules in these documents. Check the documents and try again.');
    }

    // --- 2. One call per ruleset ------------------------------------------
    const rulesets: BibleRuleset[] = [];
    for (const [index, item] of plan.value.rulesets.entries()) {
      const instruction = buildRulesetInstruction(item, index, plan.value.rulesets.length);
      let res = await step(instruction, rulesetJsonSchema(), 'ruleset', true);

      // Running out of output tokens produces truncated JSON, which is a
      // formatting problem rather than a content one — a thorough ruleset is
      // simply long. Ask once more for a shorter one instead of throwing away
      // the rulesets already generated.
      if (res.stopReason === 'max_tokens') {
        console.warn(`[kb] ruleset ${item.id} hit max_tokens, retrying with a brevity instruction`);
        res = await step(
          `${instruction}\n\nJe vorige poging werd afgekapt omdat het antwoord te lang was. Geef dezelfde ruleset opnieuw, maar aanzienlijk beknopter: houd elk tekstveld bij één zin en laat toelichtingen weg die niet nodig zijn om de regel toe te passen.`,
          rulesetJsonSchema(),
          'ruleset',
          true,
        );
      }

      if (res.stopReason === 'refusal' || res.stopReason === 'max_tokens') {
        return failed(
          `ruleset ${item.id} stop_reason ${res.stopReason}`,
          `The AI could not complete ruleset "${item.title_nl}". Please try again.`,
        );
      }
      const one = safeParse(rulesetSchema, res.text);
      if (!one.ok) return failed(`ruleset ${item.id}: ${one.error}`, `Ruleset "${item.title_nl}" did not match the expected structure. Please try again.`);
      rulesets.push(one.value);
    }

    // --- 3. Glossary + the model's own open questions ----------------------
    const tailResult = await step(
      buildTailInstruction(rulesets.map((r) => r.title_nl)),
      bibleTailJsonSchema(),
      'bible_tail',
    );
    const tail = safeParse(bibleTailSchema, tailResult.text);
    // A missing glossary is not worth throwing away a whole rulebook for.
    const tailValue = tail.ok ? tail.value : { glossary: [], open_questions: [] };
    if (!tail.ok) console.error('[kb] tail call unusable, continuing without it:', tail.error);

    // --- 4. Assemble and validate the whole thing --------------------------
    const parsed = safeParseBible(
      JSON.stringify({
        schema_version: '1',
        rulesets,
        glossary: tailValue.glossary,
        open_questions: tailValue.open_questions,
      }),
    );
    if (!parsed.ok) {
      return failed(`assembled bible: ${parsed.error}`, 'The assembled rulebook did not validate. Please try again.');
    }

    const result = { model: lastModel };

    const { data: maxRow } = await admin
      .from('kb_versions')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (maxRow?.version ?? 0) + 1;

    const redactionsApplied: Record<string, Record<string, number>> = {};
    for (const p of prepared) {
      if (Object.keys(p.redactions).length > 0) {
        redactionsApplied[p.doc.filename] = p.redactions;
      }
    }

    const { data: inserted, error: insertError } = await admin
      .from('kb_versions')
      .insert({
        version: nextVersion,
        status: 'draft',
        rules: parsed.rules,
        rendered_markdown: renderBibleMarkdown(parsed.rules),
        provider: client.id,
        model: result.model,
        prompt_version: KB_ANALYSIS_PROMPT_VERSION,
        source_documents: prepared.map((p) => ({
          id: p.doc.id,
          filename: p.doc.filename,
          sha256: p.extractedSha256,
        })),
        redactions_applied: redactionsApplied,
        input_tokens: totalInput,
        output_tokens: totalOutput,
        latency_ms: totalLatency,
        created_by: profile.id,
      })
      .select('id')
      .single();

    const kbUsage = {
      model: result.model,
      inputTokens: totalInput,
      outputTokens: totalOutput,
      latencyMs: totalLatency,
    };

    if (insertError || !inserted) {
      await recordKbRun(admin, client.id, kbUsage, {
        status: 'error',
        error: 'kb_versions insert failed',
      });
      return { success: false, error: 'The analysis succeeded but could not be saved.' };
    }

    await recordKbRun(admin, client.id, kbUsage, { status: 'ok' }, inserted.id);

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'kb_analysis_run',
      entity_type: 'kb_versions',
      entity_id: inserted.id,
      details: {
        version: nextVersion,
        model: result.model,
        input_tokens: totalInput,
        output_tokens: totalOutput,
        documents: prepared.length,
      },
    });

    return { success: true, data: { versionId: inserted.id } };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Put the knowledge-base analysis in the same cost ledger as everything else.
 *
 * This is the most expensive call the platform makes — the whole confidential
 * corpus through a large model, sometimes twice when the first output fails
 * schema validation — and it was the one call that recorded nothing, so the
 * admin dashboard's "what the AI cost" figure excluded it entirely.
 *
 * ai_profile_id is NULL: no AI employee ran this, the platform did.
 */
async function recordKbRun(
  admin: ReturnType<typeof createAdminClient>,
  provider: string,
  usage: { model: string; inputTokens: number; outputTokens: number; latencyMs: number },
  outcome: { status: 'ok' | 'error'; error?: string },
  kbVersionId?: string,
): Promise<void> {
  const { error } = await admin.from('ai_runs').insert({
    ai_profile_id: null,
    provider,
    model: usage.model,
    run_type: 'kb_analysis',
    kb_version_id: kbVersionId ?? null,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    latency_ms: usage.latencyMs,
    cost_estimate_cents: estimateCostCents(usage.model, usage.inputTokens, usage.outputTokens),
    status: outcome.status,
    error: outcome.error ?? null,
  });
  // Never let ledger bookkeeping fail the analysis itself.
  if (error) console.error('[kb] could not record ai_runs row:', error);
}

/** Parse provider JSON against any zod schema, with a readable error. */
function safeParse<T>(
  schema: z.ZodType<T>,
  text: string,
): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      };
    }
    return { ok: true, value: parsed.data };
  } catch {
    return { ok: false, error: 'Response was not valid JSON.' };
  }
}

function safeParseBible(
  text: string,
): { ok: true; rules: import('@/app/lib/ai/bible-schema').BibleRules } | { ok: false; error: string } {
  try {
    const json = JSON.parse(text);
    const parsed = bibleSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
    }
    return { ok: true, rules: parsed.data };
  } catch {
    return { ok: false, error: 'Response was not valid JSON.' };
  }
}

/** Promote a draft/archived version to active (atomic; archives the current). */
export async function activateKbVersion(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = kbVersionIdSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid version id' };

    const admin = createAdminClient();
    const { data: activated, error } = await admin.rpc('activate_kb_version', {
      p_id: parsed.data.id,
      p_admin: profile.id,
    });
    if (error || !activated) {
      return { success: false, error: 'Could not activate this version.' };
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'kb_version_activated',
      entity_type: 'kb_versions',
      entity_id: parsed.data.id,
      details: {},
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Archive a DRAFT version (the active one is archived by activating another). */
export async function archiveKbVersion(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = kbVersionIdSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid version id' };

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('kb_versions')
      .update({ status: 'archived' })
      .eq('id', parsed.data.id)
      .eq('status', 'draft')
      .select('id')
      .maybeSingle();

    if (error) return { success: false, error: 'Could not archive this version.' };
    if (!updated) {
      return { success: false, error: 'Only a draft version can be archived directly.' };
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'kb_version_archived',
      entity_type: 'kb_versions',
      entity_id: parsed.data.id,
      details: {},
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}
