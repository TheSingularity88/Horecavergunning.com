'use server';

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
import { bibleSchema, bibleJsonSchema } from '@/app/lib/ai/bible-schema';
import { renderBibleMarkdown } from '@/app/lib/ai/render-bible';
import {
  KB_ANALYSIS_PROMPT_VERSION,
  KB_ANALYSIS_SYSTEM,
  buildKbAnalysisUserText,
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
    const schema = { name: 'bible', schema: bibleJsonSchema() };

    let result = await client.complete({
      model: KB_ANALYSIS_MODEL,
      system: KB_ANALYSIS_SYSTEM,
      messages: [{ role: 'user', content: userContent }],
      maxTokens: 64000,
      jsonSchema: schema,
    });

    if (result.stopReason === 'refusal') {
      return { success: false, error: 'The AI provider declined this request.', code: 'ai_unavailable' };
    }
    if (result.stopReason === 'max_tokens') {
      return {
        success: false,
        error: 'The analysis output was too large and got cut off. Please try again.',
        code: 'ai_unavailable',
      };
    }

    // Validate; one retry with the validation errors appended.
    let totalInput = result.inputTokens;
    let totalOutput = result.outputTokens;
    let totalLatency = result.latencyMs;
    let parsed = safeParseBible(result.text);

    if (!parsed.ok) {
      const retry = await client.complete({
        model: KB_ANALYSIS_MODEL,
        system: KB_ANALYSIS_SYSTEM,
        messages: [
          { role: 'user', content: userContent },
          { role: 'assistant', content: [{ type: 'text', text: result.text }] },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Je vorige antwoord voldeed niet aan het schema. Fouten: ${parsed.error.slice(0, 2000)}\n\nGeef het volledige, gecorrigeerde JSON-regelboek.`,
              },
            ],
          },
        ],
        maxTokens: 64000,
        jsonSchema: schema,
      });
      totalInput += retry.inputTokens;
      totalOutput += retry.outputTokens;
      totalLatency += retry.latencyMs;
      result = retry;
      parsed = safeParseBible(retry.text);
    }

    if (!parsed.ok) {
      console.error('[kb] analysis output failed validation twice:', parsed.error);
      await admin.from('activity_log').insert({
        user_id: profile.id,
        action: 'kb_analysis_failed',
        entity_type: 'kb_versions',
        entity_id: null,
        details: { reason: 'schema_validation', error: parsed.error.slice(0, 500) },
      });
      return {
        success: false,
        error: 'The AI produced output that did not match the expected structure. Please try again.',
        code: 'ai_unavailable',
      };
    }

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

    if (insertError || !inserted) {
      return { success: false, error: 'The analysis succeeded but could not be saved.' };
    }

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
