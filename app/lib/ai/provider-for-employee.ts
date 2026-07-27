import 'server-only';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { decryptSecret } from '@/app/lib/ai/crypto';
import { createProviderClient, type AiProviderClient } from '@/app/lib/ai/provider';
import { ConfigurationError } from '@/app/lib/errors';

export interface ResolvedEmployeeProvider {
  client: AiProviderClient;
  /** The model to use: the employee override, else the provider default. */
  model: string;
  providerName: string;
}

/**
 * Resolve the provider client + model an AI employee should run with. This is
 * the ONLY place a stored provider key is decrypted; the plaintext never
 * leaves this function's return path into any log, response, or client.
 *
 * Throws a typed error (mapped to a clear message upstream) when the employee
 * has no config, no active provider, or the encryption secret is missing.
 */
export async function resolveEmployeeProvider(
  aiProfileId: string,
): Promise<ResolvedEmployeeProvider> {
  const admin = createAdminClient();

  const { data: config } = await admin
    .from('ai_employee_config')
    .select('provider_id, model')
    .eq('profile_id', aiProfileId)
    .maybeSingle();
  if (!config || !config.provider_id) {
    throw new ConfigurationError('This AI employee has no provider configured.');
  }

  const { data: provider } = await admin
    .from('ai_providers')
    .select('provider, encrypted_key, default_model, is_active')
    .eq('id', config.provider_id)
    .maybeSingle();
  if (!provider) {
    throw new ConfigurationError('The AI employee references a provider that no longer exists.');
  }
  if (!provider.is_active) {
    throw new ConfigurationError('The AI provider key is deactivated. Add an active key first.');
  }

  const apiKey = decryptSecret(provider.encrypted_key);
  const client = await createProviderClient(
    provider.provider as 'anthropic' | 'openai' | 'google',
    apiKey,
  );

  return {
    client,
    model: config.model ?? provider.default_model,
    providerName: provider.provider,
  };
}
