import { NextResponse } from 'next/server';
import { authenticateAgent } from '@/app/lib/agent/auth';
import { agentToolCatalogue } from '@/app/lib/agent/run-tool';
import { agentAuthResponse } from '@/app/lib/agent/http';

/**
 * GET /api/agent/v1/tools — what this key may do.
 *
 * The catalogue is generated from the same registry the internal AI uses, and
 * marks each tool `allowed` for THIS key's scopes, so an agent can plan without
 * discovering its limits by being refused halfway through a task.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateAgent(request);
  if (!auth.ok) return agentAuthResponse(auth);

  return NextResponse.json({
    employee: { id: auth.principal.aiProfileId, name: auth.principal.aiName },
    scopes: auth.principal.scopes,
    tools: agentToolCatalogue(auth.principal),
    how_to_call: 'POST /api/agent/v1/tools/{name} with the arguments as a JSON body.',
    rules: {
      propose:
        'A propose-tier tool files a PENDING proposal. Nothing changes until a human approves it in the review queue — do not tell anyone the change has been made.',
      never: 'You cannot contact a customer, and you have no administrator access.',
    },
  });
}
