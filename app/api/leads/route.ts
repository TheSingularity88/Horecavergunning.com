import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { leadSchema } from '@/app/lib/validation/leads';
import { checkRateLimit, clientIp } from '@/app/lib/rate-limit';
import { sendEmail, ownerEmail } from '@/app/lib/email/resend';
import { contactLeadOwner } from '@/app/lib/email/templates';

/**
 * Public lead intake for the quiz, contact form, and newsletter.
 * - zod validation + honeypot
 * - IP + email rate limiting
 * - service-role insert (leads has no anon RLS policy by design)
 * - fire-and-forget owner notification (not for newsletter)
 */
export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 422 }
    );
  }
  const data = parsed.data;

  // Honeypot filled → silently accept (don't tip off bots) but drop it.
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(request.headers);
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`lead:ip:${ip}`, 10, 3600), // 10/hour per IP
    checkRateLimit(`lead:email:${data.email.toLowerCase()}`, 5, 3600), // 5/hour per email
  ]);
  if (!ipOk || !emailOk) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  const admin = createAdminClient();

  // Resolve permit type slug → id (optional).
  let permitTypeId: string | null = null;
  if (data.permit_type_slug) {
    const { data: pt } = await admin
      .from('permit_types')
      .select('id')
      .eq('slug', data.permit_type_slug)
      .maybeSingle();
    permitTypeId = pt?.id ?? null;
  }

  const { error } = await admin.from('leads').insert({
    source: data.source,
    name: data.name || null,
    email: data.email,
    phone: data.phone || null,
    company_name: data.company_name || null,
    message: data.message || null,
    permit_type_id: permitTypeId,
    quiz_answers: data.quiz_answers
      ? (data.quiz_answers as Record<string, never>)
      : null,
    locale: data.locale,
  });

  if (error) {
    console.error('[api/leads] insert error:', error);
    return NextResponse.json({ error: 'Could not save your request.' }, { status: 500 });
  }

  // Notify the owner (skip for newsletter-only signups). Don't block the response.
  if (data.source !== 'newsletter') {
    const owner = ownerEmail();
    if (owner) {
      const tpl = contactLeadOwner({
        source: data.source,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company_name,
        message: data.message,
      });
      void sendEmail({ to: owner, subject: tpl.subject, html: tpl.html, replyTo: data.email });
    }
  }

  return NextResponse.json({ ok: true });
}
