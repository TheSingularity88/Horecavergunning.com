import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/types/database';

/**
 * Cookieless, anon-key Supabase client for PUBLIC reads (permit catalog,
 * pricing, public settings) on marketing pages. Because it never touches
 * cookies(), pages that use it can be statically generated / ISR-cached
 * (unlike the cookie-based server client). Only read data that is safe under
 * the anon RLS policies.
 *
 * Also used in the browser (public-settings fetches from Footer/contact), so:
 * - it must be a SINGLETON — constructing a new GoTrueClient per call fires
 *   the "Multiple GoTrueClient instances" warning;
 * - it must use a DISTINCT storageKey with fully inert auth, so it never
 *   shares (or races) the real auth client's sb-<ref>-auth-token storage key.
 */
function newPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-hv-public',
      },
    }
  );
}

let publicClient: ReturnType<typeof newPublicClient> | undefined;

export function createPublicClient() {
  publicClient ??= newPublicClient();
  return publicClient;
}
