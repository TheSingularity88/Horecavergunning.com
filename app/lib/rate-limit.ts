import 'server-only';

import { createAdminClient } from '@/app/lib/supabase/admin';

/**
 * Fixed-window rate limit backed by the Postgres check_rate_limit function.
 * Returns true if the action is allowed. Fails OPEN (allows) if the limiter
 * itself errors, so a DB hiccup never blocks a legitimate lead.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_max: max,
      p_window: `${windowSeconds} seconds`,
    });
    if (error) {
      console.error('[rate-limit] error:', error);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error('[rate-limit] unexpected error:', err);
    return true;
  }
}

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}
