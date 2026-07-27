import { NextResponse } from 'next/server';
import { authenticateAgent } from '@/app/lib/agent/auth';
import { runAgentTool } from '@/app/lib/agent/run-tool';
import { agentAuthResponse } from '@/app/lib/agent/http';

/**
 * POST /api/agent/v1/tools/{name} — do one thing.
 *
 * This is the whole write surface. It dispatches into the same tool registry
 * the internal AI uses, so the tiering is not re-decided here: a `propose` tool
 * files a proposal for a human, a `write` tool changes internal state, and a
 * key without the matching scope is refused before the tool runs.
 *
 * No CORS headers: server-to-server only, so a browser on another origin cannot
 * read a response even if a key leaked into one.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ tool: string }> }) {
  const auth = await authenticateAgent(request);
  if (!auth.ok) return agentAuthResponse(auth);

  const { tool } = await context.params;

  // A malformed body is the agent's mistake, not a server error — say which.
  let body: unknown;
  try {
    const text = await request.text();
    body = text.trim() ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { error: 'bad_input', message: 'The request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const outcome = await runAgentTool(auth.principal, tool, body);

  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.reason, message: outcome.message },
      { status: outcome.status },
    );
  }

  return NextResponse.json({
    tool: outcome.tool,
    access: outcome.access,
    result: outcome.result,
    // Restated on every propose response. An agent that reports "done" to a
    // colleague when a human has not approved yet is the failure mode this
    // whole design exists to prevent.
    ...(outcome.access === 'propose'
      ? {
          note: 'Filed as a PENDING proposal. Nothing has changed yet — a human must approve it in the review queue. Do not report this as done.',
        }
      : {}),
  });
}
