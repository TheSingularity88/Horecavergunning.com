'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireStaff, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { reviewRequestSchema } from '@/app/lib/validation/requests';
import { createInvoiceForCase } from '@/app/lib/actions/billing';

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

    const { data: request, error: fetchError } = await admin
      .from('client_requests')
      .select('*')
      .eq('id', parsed.data.requestId)
      .maybeSingle();
    if (fetchError || !request) {
      return { success: false, error: 'Request not found.' };
    }
    if (request.status !== 'pending' && request.status !== 'reviewing') {
      return { success: false, error: 'This request has already been reviewed.' };
    }

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
      return { success: false, error: 'Failed to create case.' };
    }

    const { error: updateError } = await admin
      .from('client_requests')
      .update({
        status: 'converted',
        reviewed_by: profile.id,
        converted_to_case_id: caseData.id,
      })
      .eq('id', request.id);
    if (updateError) {
      return { success: false, error: 'Case created but request update failed.' };
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
