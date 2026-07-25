import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { getMollie } from '@/app/lib/mollie';
import { sendEmail, ownerEmail } from '@/app/lib/email/resend';
import { paymentReceivedClient, paymentReceivedOwner } from '@/app/lib/email/templates';
import type { InvoiceStatus, Locale } from '@/app/lib/types/database';

/** Mollie payment ids look like `tr_xxxxxxxx`. Validate before we call out. */
const MOLLIE_ID = /^tr_[A-Za-z0-9]+$/;

/**
 * Mollie webhook. Mollie POSTs only the payment id (`id`) and never trusts the
 * body's contents — we refetch the payment from the Mollie API to learn its
 * real status. Idempotent: replays don't double-apply.
 *
 * Status contract, which matters because Mollie only retries on a non-2xx:
 * - 200 for terminal outcomes (handled, unknown payment, not configured).
 *   Retrying those would never succeed.
 * - 500 for anything transient or unexpected (Mollie API down, a failed DB
 *   write). We WANT the retry — previously every error returned 200, so a
 *   database hiccup silently dropped a real payment with no retry and no
 *   reconciliation, leaving the customer charged and the invoice open.
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
  // Malformed id: terminal, and never worth forwarding to the Mollie API.
  if (!paymentId || !MOLLIE_ID.test(paymentId)) {
    return NextResponse.json({ ok: true });
  }

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

    // Record this webhook event (audit trail of payment attempts). A failure
    // here is transient, so surface it and let Mollie retry.
    const { error: paymentInsertError } = await admin.from('payments').insert({
      invoice_id: invoice.id,
      mollie_payment_id: payment.id,
      mollie_status: payment.status,
      amount_cents: amountCents,
      method: (payment.method as string | null) ?? null,
      raw: payment as unknown as Record<string, never>,
    });
    if (paymentInsertError) {
      throw new Error(`payments insert failed: ${paymentInsertError.message}`);
    }

    // Map Mollie status → invoice status.
    const statusMap: Record<string, InvoiceStatus> = {
      paid: 'paid',
      failed: 'failed',
      canceled: 'canceled',
      expired: 'expired',
    };
    const newStatus = statusMap[payment.status];

    // Defence in depth: the amount is set server-side when we create the
    // payment, but never mark an invoice paid for less than it is worth.
    // Flag the mismatch for a human instead of silently accepting it.
    if (newStatus === 'paid' && amountCents < invoice.amount_cents) {
      console.error(
        `[webhook/mollie] underpayment on invoice ${invoice.id}: paid ${amountCents} of ${invoice.amount_cents}`
      );
      await admin.from('activity_log').insert({
        user_id: null,
        action: 'payment_amount_mismatch',
        entity_type: 'invoices',
        entity_id: invoice.id,
        details: {
          paid_cents: amountCents,
          expected_cents: invoice.amount_cents,
          mollie_payment_id: payment.id,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Only transition an OPEN invoice (idempotent: already-paid stays paid).
    if (newStatus && invoice.status !== 'paid') {
      const { error: updateError } = await admin
        .from('invoices')
        .update({
          status: newStatus,
          mollie_payment_id: payment.id,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', invoice.id);
      if (updateError) {
        throw new Error(`invoice update failed: ${updateError.message}`);
      }

      if (newStatus === 'paid') {
        await onPaid(admin, invoice.id, invoice.case_id, invoice.client_id, invoice.invoice_number);
      }
    }
  } catch (err) {
    console.error('[webhook/mollie] error:', err);
    // 500 so Mollie retries. Returning 200 here would drop a real payment.
    return NextResponse.json({ ok: false }, { status: 500 });
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
  //
  // These are AWAITED, not fire-and-forget. A serverless function can be
  // frozen the moment it returns its response, so a floating `void sendEmail`
  // promise is routinely killed mid-flight — the customer pays and never hears
  // anything. Each send is isolated so a mail failure cannot fail the webhook
  // (which would make Mollie retry the whole event).
  if (client?.email) {
    const tpl = paymentReceivedClient({
      locale: 'nl' as Locale,
      caseTitle,
      invoiceNumber,
    });
    await sendEmail({ to: client.email, subject: tpl.subject, html: tpl.html }).catch((err) =>
      console.error('[webhook/mollie] client confirmation email failed:', err)
    );
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
    await sendEmail({ to: owner, subject: tpl.subject, html: tpl.html }).catch((err) =>
      console.error('[webhook/mollie] owner notification email failed:', err)
    );
  }

  await admin.from('activity_log').insert({
    user_id: null,
    action: 'payment_received',
    entity_type: 'invoices',
    entity_id: invoiceId,
    details: { invoice_number: invoiceNumber },
  });
}
