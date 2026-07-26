'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import {
  requireClient,
  requireStaff,
  toActionError,
  type ActionResult,
} from '@/app/lib/auth/guards';
import { newClientRequestSchema, reviewRequestSchema } from '@/app/lib/validation/requests';
import { createInvoiceForCase } from '@/app/lib/actions/billing';
import { sendEmail, ownerEmail } from '@/app/lib/email/resend';
import { newRequestOwner } from '@/app/lib/email/templates';

/**
 * Snapshot the required-documents template of a permit type into per-case
 * checklist rows. This is the foundation for the future automated document
 * checking flow.
 */
async function snapshotChecklist(
  admin: ReturnType<typeof createAdminClient>,
  caseId: string,
  permitTypeId: string | null
) {
  if (!permitTypeId) return;
  const { data: required } = await admin
    .from('required_documents')
    .select('id, name_nl, sort_order')
    .eq('permit_type_id', permitTypeId)
    .order('sort_order');
  if (!required || required.length === 0) return;

  await admin.from('case_documents').insert(
    required.map((r) => ({
      case_id: caseId,
      required_document_id: r.id,
      name: r.name_nl,
      status: 'pending',
      sort_order: r.sort_order,
    }))
  );
}

/**
 * Submit a new permit request from the client portal.
 *
 * This used to be a raw browser insert into client_requests, which meant the
 * zod schema was never applied and — more importantly — nobody was told. A
 * customer could submit a request and it would sit in the database with no
 * email to the owner and no acknowledgement anywhere. The owner only found it
 * by happening to open the dashboard.
 */
export async function submitClientRequest(
  input: unknown
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const { clientId } = await requireClient();

    const parsed = newClientRequestSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.',
      };
    }
    const data = parsed.data;

    const admin = createAdminClient();

    const { data: inserted, error } = await admin
      .from('client_requests')
      .insert({
        client_id: clientId,
        request_type: data.request_type,
        permit_type_id: data.permit_type_id ?? null,
        title: data.title,
        description: data.description || null,
        municipality: data.municipality || null,
        urgency: data.urgency,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !inserted) {
      return {
        success: false,
        error: 'Could not submit your request. Please try again.',
        code: 'request_submit_failed',
      };
    }

    // Tell the owner. Awaited (a floating promise gets killed when the
    // serverless function freezes) but isolated — a mail outage must not make
    // the customer think their submission failed.
    const owner = ownerEmail();
    if (owner) {
      const { data: client } = await admin
        .from('clients')
        .select('company_name')
        .eq('id', clientId)
        .maybeSingle();

      const tpl = newRequestOwner({
        company: client?.company_name ?? 'Onbekend bedrijf',
        requestTitle: data.title,
        requestType: data.request_type,
      });
      await sendEmail({ to: owner, subject: tpl.subject, html: tpl.html }).catch((err) =>
        console.error('[requests] owner notification failed:', err)
      );
    }

    return { success: true, data: { requestId: inserted.id } };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Approve a client request: creates a case from it and marks the request
 * converted. Returns the new case id.
 */
export async function approveClientRequest(input: {
  requestId: string;
}): Promise<ActionResult<{ caseId: string }>> {
  try {
    const { profile } = await requireStaff();
    const parsed = reviewRequestSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid request id' };
    }

    const admin = createAdminClient();

    // CLAIM the request atomically before doing any work.
    //
    // This used to read the status and then write, which is a race: two
    // concurrent approvals (a double-click, a retried request) both read
    // 'pending' and both went on to create a case, a checklist and an invoice.
    // The conditional UPDATE is the gate — only one caller can move the row out
    // of pending/reviewing, and whoever loses gets zero rows back and stops.
    const { data: claimed, error: claimError } = await admin
      .from('client_requests')
      .update({ status: 'converted', reviewed_by: profile.id })
      .eq('id', parsed.data.requestId)
      .in('status', ['pending', 'reviewing'])
      .select('*')
      .maybeSingle();

    if (claimError) {
      return { success: false, error: 'Could not approve this request. Please try again.' };
    }
    if (!claimed) {
      // Either it does not exist or somebody already reviewed it. Distinguish
      // the two only to give a useful message.
      const { data: exists } = await admin
        .from('client_requests')
        .select('id')
        .eq('id', parsed.data.requestId)
        .maybeSingle();
      return {
        success: false,
        error: exists ? 'This request has already been reviewed.' : 'Request not found.',
      };
    }
    const request = claimed;

    /**
     * Put the request back if we cannot finish what we claimed. Always returns
     * it to 'pending' — the claim already overwrote the row, so the original
     * pending/reviewing distinction is gone, and 'pending' is the safe choice
     * because it keeps the request in the staff queue.
     */
    const releaseClaim = async () => {
      await admin
        .from('client_requests')
        .update({ status: 'pending', reviewed_by: null })
        .eq('id', request.id);
    };

    const { data: caseData, error: caseError } = await admin
      .from('cases')
      .insert({
        client_id: request.client_id,
        title: request.title,
        description: request.description,
        case_type: request.request_type,
        permit_type_id: request.permit_type_id,
        status: 'intake',
        priority: request.urgency === 'urgent' ? 'urgent' : 'normal',
        municipality: request.municipality,
        assigned_employee_id: profile.id,
      })
      .select('id, permit_type_id')
      .single();
    if (caseError || !caseData) {
      // We claimed it but produced nothing — hand it back so it is not stuck
      // as 'converted' with no case attached.
      await releaseClaim();
      return { success: false, error: 'Failed to create case.' };
    }

    // Status and reviewer were already set by the claim; only the link remains.
    const { error: linkError } = await admin
      .from('client_requests')
      .update({ converted_to_case_id: caseData.id })
      .eq('id', request.id);
    if (linkError) {
      // The case exists and the request is correctly marked converted; only the
      // back-reference is missing. Log it rather than failing the approval or
      // orphaning the case we just created.
      console.error('[requests] approved but converted_to_case_id link failed:', linkError);
    }

    // Snapshot the document checklist for this permit type onto the case.
    await snapshotChecklist(admin, caseData.id, caseData.permit_type_id);

    // Create the invoice + Mollie payment link and email the client.
    // Non-fatal: approval succeeds even if billing/email is not configured.
    await createInvoiceForCase(caseData.id);

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'request_approved',
      entity_type: 'client_requests',
      entity_id: request.id,
      details: { case_id: caseData.id, request_type: request.request_type },
    });

    return { success: true, data: { caseId: caseData.id } };
  } catch (err) {
    return toActionError(err);
  }
}

/** Reject a client request. */
export async function rejectClientRequest(input: { requestId: string }): Promise<ActionResult> {
  try {
    const { profile } = await requireStaff();
    const parsed = reviewRequestSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid request id' };
    }

    const admin = createAdminClient();

    const { data: request } = await admin
      .from('client_requests')
      .select('id, status')
      .eq('id', parsed.data.requestId)
      .maybeSingle();
    if (!request) {
      return { success: false, error: 'Request not found.' };
    }
    if (request.status !== 'pending' && request.status !== 'reviewing') {
      return { success: false, error: 'This request has already been reviewed.' };
    }

    const { error } = await admin
      .from('client_requests')
      .update({ status: 'rejected', reviewed_by: profile.id })
      .eq('id', request.id);
    if (error) return { success: false, error: 'Failed to reject request.' };

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'request_rejected',
      entity_type: 'client_requests',
      entity_id: request.id,
      details: {},
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}
