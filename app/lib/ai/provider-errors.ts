import 'server-only';

/**
 * Turn a provider exception into something the person who clicked the button
 * can act on.
 *
 * Written after a real incident: an assessment and a chat message both failed
 * with "The AI provider call failed." while the actual causes — an empty
 * credit balance and a revoked API key — sat in the ai_runs table where only
 * someone with database access would find them. Both are fixed in two minutes
 * IF you know which one it is, and unfixable if you don't.
 *
 * Only well-understood, non-sensitive provider conditions are surfaced. The
 * raw message is never passed through: it can carry request ids, org ids and
 * internal detail that belongs in the server log.
 */

export type ProviderFailure =
  | 'no_credit'
  | 'bad_key'
  | 'rate_limited'
  | 'overloaded'
  | 'too_large'
  | 'unknown';

export function classifyProviderError(err: unknown): ProviderFailure {
  const raw = err instanceof Error ? err.message : String(err);
  const text = raw.toLowerCase();

  // Ordered by how specific the signal is: a 400 mentioning credit is a
  // billing problem even though 400 usually means a malformed request.
  if (text.includes('credit balance') || text.includes('billing')) return 'no_credit';
  if (
    text.includes('authentication_error') ||
    text.includes('api key is invalid') ||
    text.includes('401')
  ) {
    return 'bad_key';
  }
  if (text.includes('rate_limit') || text.includes('429')) return 'rate_limited';
  if (text.includes('overloaded') || text.includes('529')) return 'overloaded';
  if (text.includes('too large') || text.includes('exceeds')) return 'too_large';
  return 'unknown';
}

/**
 * Staff-facing English (the rest of the server actions are English too; the
 * client portal translates by code, staff screens do not yet).
 */
export function providerFailureMessage(failure: ProviderFailure): string {
  switch (failure) {
    case 'no_credit':
      return 'The AI provider rejected the request: the Anthropic account has no credit left. An admin can top it up at console.anthropic.com → Billing.';
    case 'bad_key':
      return 'The AI provider rejected the API key (invalid or revoked). An admin can store a new one under Admin → AI employees → AI providers.';
    case 'rate_limited':
      return 'The AI provider is rate-limiting us right now. Wait a minute and try again.';
    case 'overloaded':
      return 'The AI provider is temporarily overloaded. Try again in a moment.';
    case 'too_large':
      return 'This request was too large for the AI provider to handle.';
    case 'unknown':
      return 'The AI provider call failed. An admin can see the exact reason under Admin → AI activity.';
  }
}

/** Classify, log the raw detail server-side, return the safe message. */
export function describeProviderError(context: string, err: unknown): string {
  const failure = classifyProviderError(err);
  console.error(`[${context}] provider call failed (${failure}):`, err);
  return providerFailureMessage(failure);
}
