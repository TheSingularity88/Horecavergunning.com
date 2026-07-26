import type { ActionErrorCode } from '@/app/lib/actions/error-codes';
import type { translations } from '@/app/lib/translations';

type T = (typeof translations)['nl'];

/**
 * Turn a failed server action into a sentence the customer can read.
 *
 * Prefers the translated message for the action's `code`; falls back to the
 * English `error` the action returned, and only then to a generic line. That
 * ordering matters: an action that has not been given a code yet still says
 * something specific ("This request has already been reviewed.") rather than
 * being flattened into "something went wrong".
 */
export function actionErrorMessage(
  result: { error?: string; code?: ActionErrorCode },
  t: T,
): string {
  const map = t.clientPortal?.errors as Record<string, string> | undefined;
  const translated = result.code ? map?.[result.code] : undefined;
  return (
    translated ??
    result.error ??
    map?.unknown ??
    'Something went wrong. Please try again.'
  );
}

/** Network/transport failure — the action never returned at all. */
export function networkErrorMessage(t: T): string {
  const map = t.clientPortal?.errors as Record<string, string> | undefined;
  return (
    map?.network ??
    'Could not reach the server. Please check your connection and try again.'
  );
}
