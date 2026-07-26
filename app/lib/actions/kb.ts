'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import {
  insertKbDocumentSchema,
  updateKbDocumentFlagsSchema,
  kbDocumentIdSchema,
} from '@/app/lib/validation/kb';

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
