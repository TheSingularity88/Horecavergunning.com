'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import {
  requireClient,
  requireStaff,
  toActionError,
  type ActionResult,
} from '@/app/lib/auth/guards';
import { getMollie, centsToMollieAmount, siteUrl } from '@/app/lib/mollie';
import { sendEmail } from '@/app/lib/email/resend';
import { requestApprovedPaymentLink } from '@/app/lib/email/templates';
import type { Locale } from '@/app/lib/types/database';

type CreateInvoiceResult = { invoiceId: string; checkoutUrl: string | null };

/**
 * Create (or reuse) an open invoice for a case and start a Mollie payment.
 * Emails the client a checkout link. Idempotent-ish: if an open/paid invoice
 * already exists for the case it is reused rather than duplicated.
 *
 * Safe to call even without MOLLIE_API_KEY — it still creates the invoice
 * record (status 'open', no checkout URL) so billing works manually in dev.
 */
export async function createInvoiceForCase(
  caseId: string
): Promise<ActionResult<CreateInvoiceResult>> {
  // Every export in a 'use server' module is a callable POST endpoint the
  // moment anything references it. This one creates invoices and charges
  // customers, so it must assert staff itself rather than rely on its callers.
  try {
    await requireStaff();
  } catch (err) {
    return toActionError(err);
  }

  const admin = createAdminClient();

  // Load case + client + permit fee.
  const { data: caseRow, error: caseError } = await admin
    .from('cases')
    .select('id, title, client_id, permit_type_id')
    .eq('id', caseId)
    .maybeSingle();
  if (caseError || !caseRow) {
    return { success: false, error: 'Case not found.' };
  }

  const { data: client } = await admin
    .from('clients')
    .select('id, company_name, email')
    .eq('id', caseRow.client_id)
    .maybeSingle();
  if (!client) {
    return { success: false, error: 'Client not found for this case.' };
  }

  let amountCents = 0;
  let description = caseRow.title;
  if (caseRow.permit_type_id) {
    const { data: pt } = await admin
      .from('permit_types')
      .select('base_fee_cents, name_nl')
      .eq('id', caseRow.permit_type_id)
      .maybeSingle();
    if (pt) {
      amountCents = pt.base_fee_cents;
      description = `${pt.name_nl} — ${caseRow.title}`;
    }
  }

  // Reuse an existing non-terminal invoice for this case if present.
  //
  // Ordered + limit(1) rather than a bare .maybeSingle(): maybeSingle ERRORS
  // when more than one row matches, which returned null and sent us down the
  // "create a new invoice" branch — so once duplicates existed, every call
  // added another one. A deterministic pick cannot compound the problem.
  const { data: existingRows } = await admin
    .from('invoices')
    .select('id, status')
    .eq('case_id', caseId)
    .in('status', ['open', 'paid'])
    .order('created_at', { ascending: true })
    .limit(1);
  const existing = existingRows?.[0] ?? null;

  let invoiceId: string;
  if (existing) {
    invoiceId = existing.id;
    if (existing.status === 'paid') {
      return { success: true, data: { invoiceId, checkoutUrl: null } };
    }
  } else {
    const { data: numberRow } = await admin.rpc('next_invoice_number');
    const invoiceNumber = (numberRow as unknown as string) ?? `HV-${Date.now()}`;

    const { data: inserted, error: invError } = await admin
      .from('invoices')
      .insert({
        client_id: client.id,
        case_id: caseId,
        invoice_number: invoiceNumber,
        amount_cents: amountCents,
        currency: 'EUR',
        status: 'open',
        description,
      })
      .select('id')
      .single();
    if (invError || !inserted) {
      // 23505 = unique violation on invoices_one_active_per_case: a concurrent
      // caller won the race and already created the invoice for this case.
      // That is the constraint doing its job, not a failure — adopt theirs.
      if (invError?.code === '23505') {
        const { data: raced } = await admin
          .from('invoices')
          .select('id')
          .eq('case_id', caseId)
          .in('status', ['open', 'paid'])
          .order('created_at', { ascending: true })
          .limit(1);
        if (raced?.[0]) {
          return { success: true, data: { invoiceId: raced[0].id, checkoutUrl: null } };
        }
      }
      return { success: false, error: 'Failed to create invoice.' };
    }
    invoiceId = inserted.id;
  }

  // Start a Mollie payment (if configured and there is an amount to charge).
  let checkoutUrl: string | null = null;
  const mollie = getMollie();
  if (mollie && amountCents > 0) {
    try {
      const payment = await mollie.payments.create({
        amount: { currency: 'EUR', value: centsToMollieAmount(amountCents) },
        description,
        redirectUrl: `${siteUrl()}/client/invoices/${invoiceId}`,
        webhookUrl: `${siteUrl()}/api/webhooks/mollie`,
        metadata: { invoice_id: invoiceId },
      });
      checkoutUrl = payment.getCheckoutUrl() ?? null;
      await admin
        .from('invoices')
        .update({ mollie_payment_id: payment.id })
        .eq('id', invoiceId);
    } catch (err) {
      console.error('[billing] mollie create error:', err);
      // Invoice still exists; owner can retry the payment link later.
    }
  }

  // Email the client the checkout link (best effort).
  if (checkoutUrl && client.email) {
    const tpl = requestApprovedPaymentLink({
      locale: 'nl' as Locale,
      caseTitle: caseRow.title,
      amountCents,
      checkoutUrl,
    });
    void sendEmail({ to: client.email, subject: tpl.subject, html: tpl.html });
  }

  return { success: true, data: { invoiceId, checkoutUrl } };
}

/**
 * Shared checkout creation. Callers MUST have authorized the caller against
 * this invoice first (staff, or the owning client) — this helper does no
 * authorization of its own.
 *
 * `expectedClientId` is a defence-in-depth ownership re-check performed in the
 * same read that loads the invoice.
 */
async function startCheckoutForInvoice(
  invoiceId: string,
  expectedClientId?: string
): Promise<ActionResult<{ checkoutUrl: string | null }>> {
  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from('invoices')
    .select('id, client_id, case_id, amount_cents, description, status')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!invoice) {
    return { success: false, error: 'Invoice not found.', code: 'invoice_not_found' };
  }
  // Same message AND same code as "not found" so a client cannot probe for
  // other clients' invoice ids — the code must not leak the distinction the
  // message deliberately hides.
  if (expectedClientId && invoice.client_id !== expectedClientId) {
    return { success: false, error: 'Invoice not found.', code: 'invoice_not_found' };
  }
  if (invoice.status === 'paid') {
    return {
      success: false,
      error: 'This invoice is already paid.',
      code: 'invoice_already_paid',
    };
  }

  const mollie = getMollie();
  if (!mollie) {
    return {
      success: false,
      error: 'Payments are not configured yet.',
      code: 'payments_unavailable',
    };
  }
  if (invoice.amount_cents <= 0) {
    return {
      success: false,
      error: 'Invoice has no amount to charge.',
      code: 'invoice_no_amount',
    };
  }

  const payment = await mollie.payments.create({
    amount: { currency: 'EUR', value: centsToMollieAmount(invoice.amount_cents) },
    description: invoice.description ?? 'HorecaVergunning',
    redirectUrl: `${siteUrl()}/client/invoices/${invoice.id}`,
    webhookUrl: `${siteUrl()}/api/webhooks/mollie`,
    metadata: { invoice_id: invoice.id },
  });

  await admin
    .from('invoices')
    .update({ mollie_payment_id: payment.id, status: 'open' })
    .eq('id', invoice.id);

  return { success: true, data: { checkoutUrl: payment.getCheckoutUrl() ?? null } };
}

/**
 * Staff-triggered: bill a case that did not come through the request-approval
 * flow (a customer who phoned or emailed).
 *
 * createInvoiceForCase had exactly one caller — approveClientRequest — so a
 * case created by hand in the dashboard could never be invoiced at all. Those
 * customers simply could not be charged through the product.
 *
 * Also self-heals the permit link: cases created before permit_type_id was
 * wired up have no permit type, so they would price at zero. We resolve it from
 * case_type (which matches permit_types.slug) before invoicing.
 */
export async function billCase(
  caseId: string
): Promise<ActionResult<CreateInvoiceResult>> {
  try {
    await requireStaff();
    const admin = createAdminClient();

    const { data: caseRow } = await admin
      .from('cases')
      .select('id, case_type, permit_type_id')
      .eq('id', caseId)
      .maybeSingle();
    if (!caseRow) return { success: false, error: 'Case not found.' };

    // Re-resolve every time, not just when null. permit_type_id is only ever
    // derived from case_type, and editing a case's type never updated it — so
    // a case switched from e.g. terrasvergunning to exploitatievergunning kept
    // the old permit's fee and billed the wrong amount.
    if (caseRow.case_type) {
      const { data: permitType } = await admin
        .from('permit_types')
        .select('id')
        .eq('slug', caseRow.case_type)
        .maybeSingle();
      if (permitType && permitType.id !== caseRow.permit_type_id) {
        await admin
          .from('cases')
          .update({ permit_type_id: permitType.id })
          .eq('id', caseId);
      }
    }

    return await createInvoiceForCase(caseId);
  } catch (err) {
    return toActionError(err);
  }
}

/** Staff-triggered: (re)generate a fresh Mollie checkout link for an invoice. */
export async function resendPaymentLink(
  invoiceId: string
): Promise<ActionResult<{ checkoutUrl: string | null }>> {
  try {
    await requireStaff();
    return await startCheckoutForInvoice(invoiceId);
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Client-triggered: start (or retry) payment for one of the caller's OWN
 * invoices. The client portal must use this — resendPaymentLink is staff-only
 * and clients have no profiles row, so it always denied them.
 */
export async function payMyInvoice(
  invoiceId: string
): Promise<ActionResult<{ checkoutUrl: string | null }>> {
  try {
    const { clientId } = await requireClient();
    return await startCheckoutForInvoice(invoiceId, clientId);
  } catch (err) {
    return toActionError(err);
  }
}
