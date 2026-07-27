import 'server-only';

import { ConfigurationError } from '@/app/lib/errors';

/**
 * Provider abstraction for AI completions.
 *
 * One interface so the platform can speak to Anthropic today and OpenAI or
 * Google later without touching call sites. Only Anthropic is implemented;
 * the other two throw ConfigurationError until someone actually needs them
 * (building speculative provider clients is how you end up maintaining three
 * SDKs for one feature).
 *
 * Phase A: the API key comes from the ANTHROPIC_API_KEY env var.
 * Phase B replaces that with per-provider keys stored encrypted in the DB.
 */

export type AiProviderId = 'anthropic' | 'openai' | 'google';

export type AiContentBlock =
  | {
      type: 'text';
      text: string;
      /**
       * Marks the end of a reusable prefix. Providers that support prompt
       * caching (Anthropic) will cache everything up to and including this
       * block, so a pipeline that sends the same corpus with a different
       * instruction each time pays full price once instead of every call.
       */
      cacheable?: boolean;
    }
  | { type: 'image'; mediaType: 'image/png' | 'image/jpeg'; base64: string };

export interface AiCompletionRequest {
  model: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: AiContentBlock[] }[];
  maxTokens: number;
  /**
   * When set, the provider must return JSON conforming to this schema
   * (Anthropic: structured outputs via output_config.format). The caller is
   * still expected to re-validate — the schema constrains generation, it does
   * not replace validation.
   */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

export interface AiCompletionResult {
  /** The response text — the JSON string when jsonSchema was set. */
  text: string;
  /**
   * UNCACHED input only. The provider bills cached input separately — writes
   * at 1.25x, reads at 0.1x — and reports those in the two fields below.
   * Ignoring them is how chat spend ended up recorded at ~5% of reality:
   * the cacheable rulebook digest is most of a chat request's input.
   */
  inputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  model: string;
  stopReason: 'end' | 'max_tokens' | 'refusal' | 'other';
  latencyMs: number;
}

export interface AiProviderClient {
  readonly id: AiProviderId;
  complete(req: AiCompletionRequest): Promise<AiCompletionResult>;
}

export async function createProviderClient(
  provider: AiProviderId,
  apiKey: string,
): Promise<AiProviderClient> {
  switch (provider) {
    case 'anthropic': {
      const { createAnthropicClient } = await import('./providers/anthropic');
      return createAnthropicClient(apiKey);
    }
    case 'openai':
    case 'google':
      throw new ConfigurationError(
        `AI provider '${provider}' is not implemented yet. Use 'anthropic'.`,
      );
  }
}

/**
 * Resolve the Anthropic client for platform-level work (the knowledge-base
 * analysis), preferring the key an admin stored in `/dashboard/admin/ai` and
 * falling back to ANTHROPIC_API_KEY.
 *
 * The DB comes first deliberately. Storing a key in the admin screen and then
 * being told "ANTHROPIC_API_KEY is missing" is the kind of split-brain that
 * costs an hour to work out; one key in one place now drives both the analysis
 * and the AI employees.
 *
 * The import is dynamic because this module is also reached from paths that
 * have no business touching the admin client or the decryption secret.
 */
export async function envAnthropicClient(): Promise<AiProviderClient> {
  const { storedAnthropicKey } = await import('./stored-key');
  const stored = await storedAnthropicKey();
  if (stored) return createProviderClient('anthropic', stored);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new ConfigurationError(
      'No Anthropic API key is available. Add one under Admin → AI employees → AI providers, ' +
        'or set ANTHROPIC_API_KEY. The AI analysis cannot run without it.',
    );
  }
  return createProviderClient('anthropic', key);
}
