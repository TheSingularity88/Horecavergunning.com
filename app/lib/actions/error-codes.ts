/**
 * Stable identifiers for the failures a *customer* can see.
 *
 * Server actions return prose in English ("This invoice is already paid."),
 * which was fine while it went to a browser `alert()` nobody had translated
 * anyway. Now that these surface as toasts in the client portal, a Dutch
 * restaurant owner must read Dutch — and the server has no reliable way to
 * know the reader's locale (the language lives in a cookie the action does
 * not receive).
 *
 * So the action returns a CODE, and the client renders the message in whatever
 * language the portal is in. `error` stays on the result as an English
 * fallback: any action that has no code yet still shows something readable,
 * so this can be adopted per action rather than in one sweep.
 *
 * This file must not import `server-only` — client components read the type.
 */

export type ActionErrorCode =
  | 'invoice_not_found'
  | 'invoice_already_paid'
  | 'payments_unavailable'
  | 'invoice_no_amount'
  | 'request_already_reviewed'
  | 'request_not_found'
  | 'request_submit_failed'
  | 'request_not_rejected'
  | 'request_reopen_failed'
  | 'not_authorised'
  /** A required environment variable is missing/empty. Retrying cannot help. */
  | 'server_misconfigured'
  /** The AI provider failed, declined, or produced unusable output. */
  | 'ai_unavailable'
  /** A knowledge-base analysis is already in flight. */
  | 'kb_analysis_running'
  | 'unknown';
