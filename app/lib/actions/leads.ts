'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { updateLeadStatusSchema, type UpdateLeadStatusInput } from '@/app/lib/validation/leads';

/** Staff: move a lead through the pipeline (new → contacted → converted/closed). */
export async function updateLeadStatus(input: UpdateLeadStatusInput): Promise<ActionResult> {
  try {
    const { profile } = await requireStaff();
    const parsed = updateLeadStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid input' };
    }
    const admin = createAdminClient();
    const { error } = await admin
      .from('leads')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.leadId);
    if (error) return { success: false, error: 'Failed to update lead.' };

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'lead_status_changed',
      entity_type: 'leads',
      entity_id: parsed.data.leadId,
      details: { status: parsed.data.status },
    });
    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}
