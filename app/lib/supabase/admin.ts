import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { ConfigurationError } from '@/app/lib/errors';
import type { Database } from '@/app/lib/types/database';

/**
 * Service-role Supabase client. BYPASSES RLS — only use inside server code
 * that has already verified authorization (see app/lib/auth/guards.ts).
 * Never import this from a client component ('server-only' enforces that).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Kept as a single `!url || !serviceRoleKey` guard so TypeScript narrows both
  // to string below; the message is built inside it. Note this treats
  // present-but-empty as missing — `SUPABASE_SERVICE_ROLE_KEY=` with nothing
  // after it reads as defined, so checking the file for the key is not enough.
  if (!url || !serviceRoleKey) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean);
    throw new ConfigurationError(
      `${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} missing or ` +
        'empty. Server actions that write to the database cannot run without it.'
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
