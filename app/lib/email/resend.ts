import 'server-only';

import { Resend } from 'resend';

let cached: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null; // Email is optional; degrade gracefully in dev.
  if (!cached) cached = new Resend(key);
  return cached;
}

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send a transactional email. Never throws into the calling flow — email
 * failures must not break signup/approval/payment. Returns whether it was sent.
 */
export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email:', args.subject);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: `HorecaVergunning <${from}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    if (error) {
      console.error('[email] send error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] unexpected error:', err);
    return false;
  }
}

export function ownerEmail(): string {
  return process.env.OWNER_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL || '';
}
