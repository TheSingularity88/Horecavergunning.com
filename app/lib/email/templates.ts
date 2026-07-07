import 'server-only';

import type { Locale } from '@/app/lib/types/database';

const BRAND = 'HorecaVergunning';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://horecavergunning.com';
}

function euro(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(
    cents / 100
  );
}

/** Minimal, inline-styled responsive shell. */
function layout(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#0f172a;padding:20px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;">Horeca<span style="color:#f59e0b;">Vergunning</span></span>
          </td></tr>
          <tr><td style="padding:28px;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
            ${BRAND} · Amsterdam · <a href="${siteUrl()}" style="color:#f59e0b;text-decoration:none;">${siteUrl().replace(/^https?:\/\//, '')}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:10px;margin:8px 0;">${label}</a>`;
}

const t = (locale: Locale, nl: string, en: string) => (locale === 'en' ? en : nl);

// ---------------------------------------------------------------------------
// Owner-facing
// ---------------------------------------------------------------------------

export function newRequestOwner(params: {
  company: string;
  requestTitle: string;
  requestType: string;
}): { subject: string; html: string } {
  return {
    subject: `Nieuwe aanvraag: ${params.requestTitle} — ${params.company}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;">Nieuwe aanvraag ontvangen</h2>
      <p style="margin:0 0 8px;"><strong>Bedrijf:</strong> ${params.company}</p>
      <p style="margin:0 0 8px;"><strong>Aanvraag:</strong> ${params.requestTitle}</p>
      <p style="margin:0 0 16px;"><strong>Type:</strong> ${params.requestType}</p>
      ${button(`${siteUrl()}/dashboard/requests`, 'Bekijk in dashboard')}
    `),
  };
}

export function contactLeadOwner(params: {
  source: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
}): { subject: string; html: string } {
  return {
    subject: `Nieuwe lead (${params.source}): ${params.name || params.email}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;">Nieuwe lead via ${params.source}</h2>
      ${params.name ? `<p style="margin:0 0 6px;"><strong>Naam:</strong> ${params.name}</p>` : ''}
      <p style="margin:0 0 6px;"><strong>E-mail:</strong> ${params.email}</p>
      ${params.phone ? `<p style="margin:0 0 6px;"><strong>Telefoon:</strong> ${params.phone}</p>` : ''}
      ${params.company ? `<p style="margin:0 0 6px;"><strong>Bedrijf:</strong> ${params.company}</p>` : ''}
      ${params.message ? `<p style="margin:12px 0 0;white-space:pre-wrap;">${params.message}</p>` : ''}
      ${button(`${siteUrl()}/dashboard/leads`, 'Bekijk leads')}
    `),
  };
}

export function paymentReceivedOwner(params: {
  company: string;
  invoiceNumber: string;
  amountCents: number;
}): { subject: string; html: string } {
  return {
    subject: `Betaling ontvangen: ${params.invoiceNumber} — ${params.company}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;">Betaling ontvangen</h2>
      <p style="margin:0 0 6px;"><strong>Bedrijf:</strong> ${params.company}</p>
      <p style="margin:0 0 6px;"><strong>Factuur:</strong> ${params.invoiceNumber}</p>
      <p style="margin:0 0 6px;"><strong>Bedrag:</strong> ${euro(params.amountCents)}</p>
    `),
  };
}

// ---------------------------------------------------------------------------
// Client-facing (locale-aware)
// ---------------------------------------------------------------------------

export function requestApprovedPaymentLink(params: {
  locale: Locale;
  caseTitle: string;
  amountCents: number;
  checkoutUrl: string;
}): { subject: string; html: string } {
  const { locale } = params;
  return {
    subject: t(
      locale,
      `Uw aanvraag is goedgekeurd — betaal om te starten`,
      `Your request is approved — pay to get started`
    ),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;">${t(locale, 'Goed nieuws!', 'Good news!')}</h2>
      <p style="margin:0 0 12px;">${t(
        locale,
        `Wij hebben uw aanvraag <strong>${params.caseTitle}</strong> in behandeling genomen. Rond de betaling af zodat wij direct voor u aan de slag kunnen.`,
        `We have accepted your request <strong>${params.caseTitle}</strong>. Complete the payment so we can start working for you right away.`
      )}</p>
      <p style="margin:0 0 12px;"><strong>${t(locale, 'Bedrag', 'Amount')}:</strong> ${euro(
        params.amountCents
      )}</p>
      ${button(params.checkoutUrl, t(locale, 'Betaal nu', 'Pay now'))}
    `),
  };
}

export function paymentReceivedClient(params: {
  locale: Locale;
  caseTitle: string;
  invoiceNumber: string;
}): { subject: string; html: string } {
  const { locale } = params;
  return {
    subject: t(locale, 'Betaling ontvangen — bedankt', 'Payment received — thank you'),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;">${t(
        locale,
        'Bedankt voor uw betaling',
        'Thank you for your payment'
      )}</h2>
      <p style="margin:0 0 12px;">${t(
        locale,
        `Wij zijn gestart met <strong>${params.caseTitle}</strong>. U kunt de voortgang volgen in uw portaal.`,
        `We have started work on <strong>${params.caseTitle}</strong>. You can follow the progress in your portal.`
      )}</p>
      <p style="margin:0 0 12px;color:#64748b;">${t(locale, 'Factuur', 'Invoice')}: ${
        params.invoiceNumber
      }</p>
      ${button(`${siteUrl()}/client/cases`, t(locale, 'Ga naar mijn portaal', 'Go to my portal'))}
    `),
  };
}

export function caseStatusChanged(params: {
  locale: Locale;
  caseTitle: string;
  statusLabel: string;
  actionRequired?: boolean;
}): { subject: string; html: string } {
  const { locale } = params;
  return {
    subject: params.actionRequired
      ? t(locale, `Actie vereist: ${params.caseTitle}`, `Action required: ${params.caseTitle}`)
      : t(
          locale,
          `Statusupdate: ${params.caseTitle}`,
          `Status update: ${params.caseTitle}`
        ),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;">${
        params.actionRequired
          ? t(locale, 'Er is actie van u nodig', 'We need something from you')
          : t(locale, 'Statusupdate', 'Status update')
      }</h2>
      <p style="margin:0 0 12px;">${t(
        locale,
        `De status van <strong>${params.caseTitle}</strong> is gewijzigd naar <strong>${params.statusLabel}</strong>.`,
        `The status of <strong>${params.caseTitle}</strong> changed to <strong>${params.statusLabel}</strong>.`
      )}</p>
      ${button(`${siteUrl()}/client/cases`, t(locale, 'Bekijk zaak', 'View case'))}
    `),
  };
}
