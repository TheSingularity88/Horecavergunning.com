import 'server-only';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { decryptSecret } from '@/app/lib/ai/crypto';

/**
 * The active Anthropic key an admin stored in the AI providers screen, or null
 * if there isn't one.
 *
 * Kept in its own module so `provider.ts` stays free of the admin client and
 * the decryption secret — only the two call sites that genuinely need a stored
 * key ever pull this in.
 *
 * Returns null rather than throwing on any failure: the caller has an env-var
 * fallback, and a broken row should not be the thing that stops an admin who
 * has ANTHROPIC_API_KEY set from running an analysis.
 */
export async function storedAnthropicKey(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('ai_providers')
      .select('encrypted_key')
      .eq('provider', 'anthropic')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data?.encrypted_key) return null;
    return decryptSecret(data.encrypted_key);
  } catch {
    // Missing AI_KEY_ENCRYPTION_SECRET, undecryptable ciphertext, unreachable
    // DB — all fall through to the env var.
    return null;
  }
}
