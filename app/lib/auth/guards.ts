import 'server-only';

import { createClient } from '@/app/lib/supabase/server';
import { ConfigurationError } from '@/app/lib/errors';
import type { ActionErrorCode } from '@/app/lib/actions/error-codes';
import type { Profile, UserRole } from '@/app/lib/types/database';
import type { User } from '@supabase/supabase-js';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 403
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** The authenticated user, or throws AuthError(401). */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthError('Not authenticated', 401);
  }
  return user;
}

/**
 * The authenticated ACTIVE staff member (employee or admin) and their profile,
 * or throws.
 */
export async function requireStaff(): Promise<{ user: User; profile: Profile }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // INVARIANT: role 'ai' is deliberately NOT in this list. AI employees are
  // profiles for attribution only — they must never pass requireStaff (nor,
  // by extension, requireAdmin). All AI work runs through service-role code
  // that writes proposals; humans execute them. Do not "fix" this by adding
  // 'ai' here.
  if (!profile || !(['employee', 'admin'] as UserRole[]).includes(profile.role as UserRole)) {
    throw new AuthError('Staff access required');
  }
  if (profile.is_active === false) {
    throw new AuthError('Account is deactivated');
  }
  return { user, profile: profile as unknown as Profile };
}

/** The authenticated ACTIVE admin and their profile, or throws. */
export async function requireAdmin(): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await requireStaff();
  if (profile.role !== 'admin') {
    throw new AuthError('Admin access required');
  }
  return { user, profile };
}

/** The authenticated client user and their client id, or throws. */
export async function requireClient(): Promise<{ user: User; clientId: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!client) {
    throw new AuthError('Client access required');
  }
  return { user, clientId: client.id };
}

/**
 * Standard shape for server-action results consumed by client components.
 *
 * `code` is optional so actions can adopt it one at a time; where it is
 * present the caller can translate the failure, where it is absent the English
 * `error` is still shown. See lib/actions/error-codes.ts.
 */
export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: ActionErrorCode };

/** Map any thrown error to a safe ActionResult (never leak internals). */
export function toActionError(err: unknown): {
  success: false;
  error: string;
  code?: ActionErrorCode;
} {
  if (err instanceof AuthError) {
    return { success: false, error: err.message, code: 'not_authorised' };
  }
  // A missing environment variable is not a transient fault. "Please try
  // again" would send the user into a loop that cannot succeed, so this says
  // plainly that it is a setup problem on our side. The specific variable name
  // stays in the server log — never in the response.
  if (err instanceof ConfigurationError) {
    console.error('[action] configuration error:', err.message);
    return {
      success: false,
      error:
        'The server is not configured correctly, so this could not be saved. ' +
        'This is a problem on our side — retrying will not help.',
      code: 'server_misconfigured',
    };
  }
  console.error('[action]', err);
  return {
    success: false,
    error: 'Something went wrong. Please try again.',
    code: 'unknown',
  };
}
