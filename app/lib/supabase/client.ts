import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Must be a SINGLETON: every GoTrueClient instance
 * reads/writes the same `sb-<ref>-auth-token` storage key, so a second one
 * races the first on session reads and token refresh ("Multiple GoTrueClient
 * instances detected"). The three AuthProviders — (auth), /client, /dashboard —
 * each mount their own provider, so navigating between portals used to create
 * a fresh client each time.
 */
function newBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

let browserClient: ReturnType<typeof newBrowserClient> | undefined;

export function createClient() {
  browserClient ??= newBrowserClient();
  return browserClient;
}
