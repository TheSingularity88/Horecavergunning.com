import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import type {
  AiCompletionRequest,
  AiCompletionResult,
  AiProviderClient,
} from '@/app/lib/ai/provider';

/**
 * Anthropic implementation of the provider interface.
 *
 * Always streams. The KB analysis generates a large JSON document in one
 * response; non-streaming requests at that size risk HTTP timeouts, and the
 * SDK's stream helper hands back the complete message via finalMessage()
 * so callers never deal with events.
 *
 * Server-side fallbacks are enabled: if Anthropic's safety classifiers
 * decline a request (HTTP 200 with stop_reason "refusal"), the API re-runs it
 * on the recommended fallback model in the same call instead of failing the
 * run. Unlikely for Dutch permit policy, but the failure mode without it is a
 * confusing empty result.
 */

export function createAnthropicClient(apiKey: string): AiProviderClient {
  const client = new Anthropic({ apiKey });

  return {
    id: 'anthropic',

    async complete(req: AiCompletionRequest): Promise<AiCompletionResult> {
      const started = Date.now();

      const stream = client.beta.messages.stream({
        model: req.model,
        max_tokens: req.maxTokens,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: req.system,
        messages: req.messages.map((message) => ({
          role: message.role,
          content: message.content.map((block) =>
            block.type === 'text'
              ? {
                  type: 'text' as const,
                  text: block.text,
                  ...(block.cacheable
                    ? { cache_control: { type: 'ephemeral' as const } }
                    : {}),
                }
              : {
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: block.mediaType,
                    data: block.base64,
                  },
                },
          ),
        })),
        ...(req.jsonSchema
          ? {
              output_config: {
                format: {
                  type: 'json_schema' as const,
                  schema: req.jsonSchema.schema,
                },
              },
            }
          : {}),
      });

      const message = await stream.finalMessage();

      const text = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      const stopReason: AiCompletionResult['stopReason'] =
        message.stop_reason === 'end_turn'
          ? 'end'
          : message.stop_reason === 'max_tokens'
            ? 'max_tokens'
            : message.stop_reason === 'refusal'
              ? 'refusal'
              : 'other';

      return {
        text,
        inputTokens: message.usage.input_tokens,
        // Billed separately from input_tokens; dropping them under-reports
        // every cached request's real cost.
        cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
        cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
        outputTokens: message.usage.output_tokens,
        model: message.model,
        stopReason,
        latencyMs: Date.now() - started,
      };
    },
  };
}
