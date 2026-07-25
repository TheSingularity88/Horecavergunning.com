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
  const { data: existing } = await admin
    .from('invoices')
    .select('id, status')
    .eq('case_id', caseId)
    .in('status', ['open', 'paid'])
    .maybeSingle();

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
  if (!invoice) return { success: false, error: 'Invoice not found.' };
  // Same message as "not found" so a client cannot probe for other clients'
  // invoice ids.
  if (expectedClientId && invoice.client_id !== expectedClientId) {
    return { success: false, error: 'Invoice not found.' };
  }
  if (invoice.status === 'paid') {
    return { success: false, error: 'This invoice is already paid.' };
  }

  const mollie = getMollie();
  if (!mollie) return { success: false, error: 'Payments are not configured yet.' };
  if (invoice.amount_cents <= 0) {
    return { success: false, error: 'Invoice has no amount to charge.' };
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
