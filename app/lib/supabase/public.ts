import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/types/database';

/**
 * Cookieless, anon-key Supabase client for PUBLIC reads (permit catalog,
 * pricing) on marketing pages. Because it never touches cookies(), pages that
 * use it can be statically generated / ISR-cached (unlike the cookie-based
 * server client). Only read data that is safe under the anon RLS policies.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
