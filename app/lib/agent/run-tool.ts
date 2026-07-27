import 'server-only';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { toolByName, AI_TOOLS, type ToolAccess } from '@/app/lib/ai/tools/registry';
import { hasScope, type AgentPrincipal } from '@/app/lib/agent/auth';

/**
 * Running ONE tool on behalf of an external AI employee.
 *
 * The whole point of this file is what it does NOT do: it does not define
 * endpoints, queries, or permissions of its own. It dispatches into the exact
 * same registry the internal AI uses, so an agent driving the dashboard over
 * HTTP obeys the identical tiering — a `propose` tool produces a pending
 * proposal for a human whether the caller sits in our chat or in Claude Code.
 *
 * A parallel set of REST endpoints would have been the obvious build, and it
 * would have drifted from the tiering the first time a tool changed.
 */

/** A tool's tier is exactly the scope a key must carry to call it. */
const REQUIRED_SCOPE: Record<ToolAccess, 'read' | 'write' | 'propose'> = {
  read: 'read',
  write: 'write',
  propose: 'propose',
};

export type AgentToolFailure = 'unknown_tool' | 'scope_denied' | 'tool_failed' | 'bad_input';

export type AgentToolResult =
  | { ok: true; tool: string; access: ToolAccess; result: unknown }
  | { ok: false; reason: AgentToolFailure; status: 400 | 403 | 404; message: string };

/** The catalogue an agent reads to know what it may do. */
export function agentToolCatalogue(principal: AgentPrincipal) {
  return AI_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    access: tool.access,
    input_schema: tool.inputSchema,
    // Say plainly which tools this particular key cannot use, rather than
    // letting the agent discover it by being refused mid-task.
    allowed: hasScope(principal, REQUIRED_SCOPE[tool.access]),
  }));
}

export async function runAgentTool(
  principal: AgentPrincipal,
  toolName: string,
  input: unknown,
): Promise<AgentToolResult> {
  const admin = createAdminClient();
  const tool = toolByName.get(toolName);

  if (!tool) {
    return {
      ok: false,
      reason: 'unknown_tool',
      status: 404,
      message: `No tool named "${toolName}". GET /api/agent/v1/tools lists what you can call.`,
    };
  }

  // Tool arguments arrive as arbitrary JSON. Reject anything that is not an
  // object outright — the tools index into it, and a string or an array would
  // produce a confusing failure deep inside a query builder.
  if (input !== undefined && (typeof input !== 'object' || input === null || Array.isArray(input))) {
    return {
      ok: false,
      reason: 'bad_input',
      status: 400,
      message: 'Arguments must be a JSON object.',
    };
  }
  const args = (input ?? {}) as Record<string, unknown>;

  const required = REQUIRED_SCOPE[tool.access];
  if (!hasScope(principal, required)) {
    // Refused BEFORE the tool runs and before the audit row, so a scope denial
    // can never have a side effect. Recorded anyway — an agent repeatedly
    // reaching for a tier it was not granted is worth seeing.
    await record(admin, principal, toolName, tool.access, args, false, null, `scope "${required}" not granted`, 0);
    return {
      ok: false,
      reason: 'scope_denied',
      status: 403,
      message: `This key does not carry the "${required}" permission, which ${toolName} requires.`,
    };
  }

  const started = Date.now();
  try {
    const result = await tool.run(args, {
      admin,
      aiProfileId: principal.aiProfileId,
      // No human triggered this. See the note on ToolContext.staffId — naming
      // one here would put a person's id on work they never asked for.
      staffId: null,
    });
    await record(
      admin,
      principal,
      toolName,
      tool.access,
      args,
      true,
      JSON.stringify(result),
      null,
      Date.now() - started,
    );
    return { ok: true, tool: toolName, access: tool.access, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'tool failed';
    await record(admin, principal, toolName, tool.access, args, false, null, message, Date.now() - started);
    // The tool's own message is returned: these are written for a model to act
    // on ("deadline must be YYYY-MM-DD"), and swallowing them would leave the
    // agent retrying the same malformed call.
    return { ok: false, reason: 'tool_failed', status: 400, message };
  }
}

/**
 * The same ai_tool_calls row the internal AI writes, so both routes land in one
 * audit trail and the monitoring screen needs no second query. staff_id is null
 * here, which is precisely how an external agent's work is told apart.
 */
async function record(
  admin: ReturnType<typeof createAdminClient>,
  principal: AgentPrincipal,
  toolName: string,
  access: ToolAccess,
  input: Record<string, unknown>,
  ok: boolean,
  resultSummary: string | null,
  error: string | null,
  durationMs: number,
): Promise<void> {
  const { error: writeError } = await admin.from('ai_tool_calls').insert({
    ai_profile_id: principal.aiProfileId,
    staff_id: null,
    tool_name: toolName,
    access,
    input: input as never,
    result_summary: resultSummary ? resultSummary.slice(0, 2000) : null,
    ok,
    error,
    duration_ms: durationMs,
  });
  if (writeError) console.error('[agent-tools] could not record tool call:', writeError);
}
