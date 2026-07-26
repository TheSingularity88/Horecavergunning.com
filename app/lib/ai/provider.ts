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
  | { type: 'text'; text: string }
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
  inputTokens: number;
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

/** Phase A: resolve the Anthropic client from the environment. */
export async function envAnthropicClient(): Promise<AiProviderClient> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new ConfigurationError(
      'ANTHROPIC_API_KEY is missing or empty. The AI analysis cannot run without it.',
    );
  }
  return createProviderClient('anthropic', key);
}
