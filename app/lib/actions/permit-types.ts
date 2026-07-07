'use server';

import { updateTag } from 'next/cache';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import {
  permitTypeSchema,
  saveRequiredDocsSchema,
  type PermitTypeInput,
  type SaveRequiredDocsInput,
} from '@/app/lib/validation/permit-types';
import { PERMIT_TYPES_TAG } from '@/app/lib/cache-tags';

/** Create or update a permit type (admin only). */
export async function savePermitType(input: PermitTypeInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { profile } = await requireAdmin();
    const parsed = permitTypeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const d = parsed.data;
    const admin = createAdminClient();

    const row = {
      slug: d.slug,
      name_nl: d.name_nl,
      name_en: d.name_en,
      description_nl: d.description_nl || null,
      description_en: d.description_en || null,
      base_fee_cents: Math.round(d.fee_euros * 100),
      is_active: d.is_active,
      sort_order: d.sort_order,
    };

    let id = d.id;
    if (id) {
      const { error } = await admin.from('permit_types').update(row).eq('id', id);
      if (error) return { success: false, error: error.message };
    } else {
      const { data, error } = await admin
        .from('permit_types')
        .insert(row)
        .select('id')
        .single();
      if (error || !data) {
        return { success: false, error: error?.message ?? 'Failed to create permit type' };
      }
      id = data.id;
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: d.id ? 'permit_type_updated' : 'permit_type_created',
      entity_type: 'permit_types',
      entity_id: id,
      details: { slug: d.slug, fee_cents: row.base_fee_cents },
    });

    updateTag(PERMIT_TYPES_TAG);
    return { success: true, data: { id: id! } };
  } catch (err) {
    return toActionError(err);
  }
}

/** Toggle active state quickly from the list. */
export async function setPermitTypeActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin
      .from('permit_types')
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    updateTag(PERMIT_TYPES_TAG);
    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Replace the required-documents checklist template for a permit type. */
export async function saveRequiredDocuments(
  input: SaveRequiredDocsInput
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = saveRequiredDocsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const { permitTypeId, documents } = parsed.data;
    const admin = createAdminClient();

    // Simple strategy: delete existing template rows and re-insert. Existing
    // case_documents keep working (their required_document_id FK is ON DELETE
    // SET NULL, so historical checklists are preserved, just unlinked).
    await admin.from('required_documents').delete().eq('permit_type_id', permitTypeId);

    if (documents.length > 0) {
      const { error } = await admin.from('required_documents').insert(
        documents.map((doc, i) => ({
          permit_type_id: permitTypeId,
          name_nl: doc.name_nl,
          name_en: doc.name_en,
          is_required: doc.is_required,
          sort_order: doc.sort_order || i,
        }))
      );
      if (error) return { success: false, error: error.message };
    }

    updateTag(PERMIT_TYPES_TAG);
    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}
