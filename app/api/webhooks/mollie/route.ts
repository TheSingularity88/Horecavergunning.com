import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { getMollie } from '@/app/lib/mollie';
import { sendEmail, ownerEmail } from '@/app/lib/email/resend';
import { paymentReceivedClient, paymentReceivedOwner } from '@/app/lib/email/templates';
import type { InvoiceStatus, Locale } from '@/app/lib/types/database';

/**
 * Mollie webhook. Mollie POSTs only the payment id (`id`) and never trusts the
 * body's contents — we refetch the payment from the Mollie API to learn its
 * real status. Idempotent: replays don't double-apply. Always returns 200 fast
 * so Mollie doesn't retry a handled event.
 */
export async function POST(request: NextRequest) {
  const mollie = getMollie();
  if (!mollie) {
    // Not configured — acknowledge so Mollie stops retrying.
    return NextResponse.json({ ok: true });
  }

  let paymentId: string | null = null;
  try {
    const form = await request.formData();
    paymentId = (form.get('id') as string) || null;
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!paymentId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  try {
    const payment = await mollie.payments.get(paymentId);
    const invoiceId = (payment.metadata as { invoice_id?: string } | null)?.invoice_id;

    // Find the invoice by metadata first, then by stored mollie_payment_id.
    const { data: invoice } = invoiceId
      ? await admin
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .maybeSingle()
      : await admin
          .from('invoices')
          .select('*')
          .eq('mollie_payment_id', paymentId)
          .maybeSingle();

    if (!invoice) {
      // Unknown payment — acknowledge and stop.
      return NextResponse.json({ ok: true });
    }

    const amountCents = Math.round(parseFloat(payment.amount.value) * 100);

    // Record this webhook event (audit trail of payment attempts).
    await admin.from('payments').insert({
      invoice_id: invoice.id,
      mollie_payment_id: payment.id,
      mollie_status: payment.status,
      amount_cents: amountCents,
      method: (payment.method as string | null) ?? null,
      raw: payment as unknown as Record<string, never>,
    });

    // Map Mollie status → invoice status.
    const statusMap: Record<string, InvoiceStatus> = {
      paid: 'paid',
      failed: 'failed',
      canceled: 'canceled',
      expired: 'expired',
    };
    const newStatus = statusMap[payment.status];

    // Only transition an OPEN invoice (idempotent: already-paid stays paid).
    if (newStatus && invoice.status !== 'paid') {
      await admin
        .from('invoices')
        .update({
          status: newStatus,
          mollie_payment_id: payment.id,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', invoice.id);

      if (newStatus === 'paid') {
        await onPaid(admin, invoice.id, invoice.case_id, invoice.client_id, invoice.invoice_number);
      }
    }
  } catch (err) {
    console.error('[webhook/mollie] error:', err);
    // Still 200 — Mollie will retry on 5xx; we log and move on.
  }

  return NextResponse.json({ ok: true });
}

async function onPaid(
  admin: ReturnType<typeof createAdminClient>,
  invoiceId: string,
  caseId: string | null,
  clientId: string,
  invoiceNumber: string
) {
  // Move the case out of intake once paid.
  let caseTitle = 'uw aanvraag';
  if (caseId) {
    const { data: caseRow } = await admin
      .from('cases')
      .select('title, status')
      .eq('id', caseId)
      .maybeSingle();
    caseTitle = caseRow?.title ?? caseTitle;
    if (caseRow?.status === 'intake') {
      await admin.from('cases').update({ status: 'in_progress' }).eq('id', caseId);
    }
  }

  const { data: client } = await admin
    .from('clients')
    .select('company_name, email')
    .eq('id', clientId)
    .maybeSingle();

  // Confirm to the client.
  if (client?.email) {
    const tpl = paymentReceivedClient({
      locale: 'nl' as Locale,
      caseTitle,
      invoiceNumber,
    });
    void sendEmail({ to: client.email, subject: tpl.subject, html: tpl.html });
  }

  // Notify the owner.
  const owner = ownerEmail();
  if (owner && client) {
    const { data: inv } = await admin
      .from('invoices')
      .select('amount_cents')
      .eq('id', invoiceId)
      .maybeSingle();
    const tpl = paymentReceivedOwner({
      company: client.company_name,
      invoiceNumber,
      amountCents: inv?.amount_cents ?? 0,
    });
    void sendEmail({ to: owner, subject: tpl.subject, html: tpl.html });
  }

  await admin.from('activity_log').insert({
    user_id: null,
    action: 'payment_received',
    entity_type: 'invoices',
    entity_id: invoiceId,
    details: { invoice_number: invoiceNumber },
  });
}
