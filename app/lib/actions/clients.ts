'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { createClientSchema } from '@/app/lib/validation/clients';

/**
 * Creating a client record.
 *
 * requireStaff, not requireAdmin, and that is a correction rather than a
 * loosening. The page claimed "admin only" in browser JavaScript and nothing
 * enforced it: /dashboard/clients/new sits outside /dashboard/admin/** so the
 * middleware never gated it, and the page wrote straight to the table with no
 * server action behind it at all. Meanwhile the database has always permitted
 * more than the UI did — `clients_insert WITH CHECK (is_staff())` and
 * `clients_update USING (is_staff())` — so an employee could already EDIT any
 * client while being told they could not create one.
 *
 * The AI settled the argument: create_client is a `write`-tier tool, so an AI
 * employee has been able to create clients that a human employee could not.
 *
 * Empty optional fields arrive as '' from the form and are stored as NULL. The
 * old direct insert spread the form state verbatim, so "no phone number" was
 * recorded as an empty string — a value that is not null, sorts oddly and
 * displays as a blank where the UI expects to show nothing.
 */
export async function createClientRecord(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { profile } = await requireStaff();
    const parsed = createClientSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const data = parsed.data;
    const orNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

    const admin = createAdminClient();
    const { data: created, error } = await admin
      .from('clients')
      .insert({
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: orNull(data.phone),
        address: orNull(data.address),
        city: orNull(data.city),
        postal_code: orNull(data.postal_code),
        kvk_number: orNull(data.kvk_number),
        notes: orNull(data.notes),
        status: data.status,
        // Whoever creates the client owns it. The old page did the same, but
        // silently — this makes it a stated rule rather than a side effect.
        assigned_employee_id: profile.id,
      })
      .select('id')
      .single();

    if (error || !created) {
      console.error('[clients] create failed:', error?.message);
      return { success: false, error: 'Could not create the client.' };
    }

    const id = (created as { id: string }).id;
    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'client_created',
      entity_type: 'clients',
      entity_id: id,
      details: { company_name: data.company_name, status: data.status },
    });

    return { success: true, data: { id } };
  } catch (err) {
    return toActionError(err);
  }
}
