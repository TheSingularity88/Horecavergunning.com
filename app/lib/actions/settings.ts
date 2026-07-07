'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { saveSettingsSchema, type SaveSettingsInput } from '@/app/lib/validation/settings';

/** Upsert system settings (admin only). */
export async function saveSystemSettings(input: SaveSettingsInput): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = saveSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const admin = createAdminClient();
    const rows = parsed.data.settings.map((s) => ({
      key: s.key,
      value: s.value,
      description: s.description || null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await admin
      .from('system_settings')
      .upsert(rows, { onConflict: 'key' });
    if (error) return { success: false, error: 'Failed to save settings.' };

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'settings_updated',
      entity_type: 'system_settings',
      entity_id: null,
      details: { keys: rows.map((r) => r.key) },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}
