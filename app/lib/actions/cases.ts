'use server';

import { z } from 'zod';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { sendEmail } from '@/app/lib/email/resend';
import { caseStatusChanged } from '@/app/lib/email/templates';
import { translations } from '@/app/lib/translations';
import type { Locale } from '@/app/lib/types/database';
import { CASE_STATUSES } from '@/app/lib/constants/cases';

const updateCaseStatusSchema = z.object({
  caseId: z.string().uuid(),
  status: z.enum(CASE_STATUSES),
});

/**
 * Statuses where the ball is in the customer's court. These get a louder
 * "action required" subject line rather than a neutral status update.
 */
const ACTION_REQUIRED_STATUSES = new Set<string>(['waiting_client']);

/**
 * Human status label for the customer's email. Reuses the same vocabulary the
 * portal shows, so the email and the portal never disagree — and so the
 * customer never receives a raw database enum like "waiting_government".
 */
function statusLabel(status: string, locale: Locale): string {
  const map = translations[locale === 'en' ? 'en' : 'nl'].clientPortal?.cases?.status as
    | Record<string, string>
    | undefined;
  return map?.[status] ?? status.replace(/_/g, ' ');
}

/**
 * Staff-triggered: move a case to a new status and TELL THE CUSTOMER.
 *
 * caseStatusChanged has existed in app/lib/email/templates.ts since the email
 * layer was written and was imported by nothing. Case status was updated
 * straight from the browser, so a case could sit in `waiting_client` — blocked,
 * waiting on the customer — and the only way they would ever find out was by
 * logging in and clicking through to it. That is the difference between a
 * portal people use and one they forget about.
 */
export async function updateCaseStatus(
  input: unknown
): Promise<ActionResult<{ status: string; notified: boolean }>> {
  try {
    const { profile } = await requireStaff();

    const parsed = updateCaseStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid case or status.' };
    }
    const { caseId, status } = parsed.data;

    const admin = createAdminClient();

    const { data: caseRow } = await admin
      .from('cases')
      .select('id, title, status, client_id')
      .eq('id', caseId)
      .maybeSingle();
    if (!caseRow) return { success: false, error: 'Case not found.' };

    // Nothing to do — and crucially, no email. Re-saving a form must not spam
    // the customer with "your status changed" when it did not.
    if (caseRow.status === status) {
      return { success: true, data: { status, notified: false } };
    }

    const { error: updateError } = await admin
      .from('cases')
      .update({ status })
      .eq('id', caseId);
    if (updateError) {
      return { success: false, error: 'Could not update the case status.' };
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'case_status_changed',
      entity_type: 'cases',
      entity_id: caseId,
      details: { from: caseRow.status, to: status },
    });

    // Notify the customer. Awaited rather than floated — a serverless function
    // can be frozen the moment it returns, which kills a dangling promise — but
    // isolated, so a mail outage never fails the status change itself.
    let notified = false;
    const { data: client } = await admin
      .from('clients')
      .select('email')
      .eq('id', caseRow.client_id)
      .maybeSingle();

    if (client?.email) {
      const locale: Locale = 'nl';
      const tpl = caseStatusChanged({
        locale,
        caseTitle: caseRow.title,
        statusLabel: statusLabel(status, locale),
        actionRequired: ACTION_REQUIRED_STATUSES.has(status),
      });
      try {
        await sendEmail({ to: client.email, subject: tpl.subject, html: tpl.html });
        notified = true;
      } catch (err) {
        console.error('[cases] status-change email failed:', err);
      }
    }

    return { success: true, data: { status, notified } };
  } catch (err) {
    return toActionError(err);
  }
}
