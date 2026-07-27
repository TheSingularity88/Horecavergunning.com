import 'server-only';

import { toolByName, type ToolContext } from '@/app/lib/ai/tools/registry';
import type { AiContentBlock, AiToolUse } from '@/app/lib/ai/provider';

/**
 * Run the tools the model asked for and turn each into a tool_result block.
 *
 * Three rules the provider enforces and this function honours:
 *  - every tool_use gets exactly one tool_result, matched on id;
 *  - a failure is a tool_result with is_error, never a dropped block — an
 *    unanswered tool_use makes the next request invalid;
 *  - all results go back in ONE user turn (the caller does that).
 *
 * Every call is written to ai_tool_calls before returning, including failures.
 * The AI can change internal state without asking, so the record of what it
 * did is the thing that makes that acceptable.
 */

/** Keeps one tool's output from swallowing the context window. */
const MAX_RESULT_CHARS = 12000;

export interface ToolRunOutcome {
  blocks: AiContentBlock[];
  /** Names of tools that actually changed something, for the UI. */
  mutations: string[];
}

export async function runToolCalls(
  toolUses: AiToolUse[],
  ctx: ToolContext,
): Promise<ToolRunOutcome> {
  const blocks: AiContentBlock[] = [];
  const mutations: string[] = [];

  for (const call of toolUses) {
    const tool = toolByName.get(call.name);
    const started = Date.now();

    if (!tool) {
      // The model invented a tool. Tell it plainly rather than failing the turn.
      blocks.push({
        type: 'tool_result',
        toolUseId: call.id,
        content: `Unknown tool "${call.name}". Use only the tools provided.`,
        isError: true,
      });
      await record(ctx, call, 'read', false, null, `unknown tool ${call.name}`, Date.now() - started);
      continue;
    }

    try {
      const result = await tool.run(call.input, ctx);
      const json = JSON.stringify(result);
      const truncated =
        json.length > MAX_RESULT_CHARS
          ? `${json.slice(0, MAX_RESULT_CHARS)}\n…[afgekapt: te veel resultaten, verfijn je zoekopdracht]`
          : json;

      blocks.push({ type: 'tool_result', toolUseId: call.id, content: truncated });
      if (tool.access !== 'read') mutations.push(tool.name);
      await record(ctx, call, tool.access, true, truncated, null, Date.now() - started);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'tool failed';
      // The model sees the reason and can correct itself — a bare "failed"
      // makes it retry the same broken call.
      blocks.push({
        type: 'tool_result',
        toolUseId: call.id,
        content: message,
        isError: true,
      });
      await record(ctx, call, tool.access, false, null, message, Date.now() - started);
    }
  }

  return { blocks, mutations };
}

async function record(
  ctx: ToolContext,
  call: AiToolUse,
  access: 'read' | 'write' | 'propose',
  ok: boolean,
  resultSummary: string | null,
  error: string | null,
  durationMs: number,
): Promise<void> {
  const { error: writeError } = await ctx.admin.from('ai_tool_calls').insert({
    ai_profile_id: ctx.aiProfileId,
    staff_id: ctx.staffId,
    tool_name: call.name,
    access,
    input: call.input as never,
    result_summary: resultSummary ? resultSummary.slice(0, 2000) : null,
    ok,
    error,
    duration_ms: durationMs,
  });
  // Never let the audit write fail the turn — but say so loudly in the log.
  if (writeError) console.error('[ai-tools] could not record tool call:', writeError);
}
