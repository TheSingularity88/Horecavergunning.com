import { NextResponse } from 'next/server';
import { agentOpenApiDocument } from '@/app/lib/agent/openapi';

/**
 * GET /api/agent/v1/openapi.json — the Action schema a Custom GPT imports.
 *
 * UNAUTHENTICATED on purpose. ChatGPT fetches this while you are configuring
 * the Action, before any key exists to send, so requiring one would make
 * "Import from URL" impossible. It describes the shape of the API and contains
 * no data and no secrets — every operation it lists still refuses an
 * unauthenticated call.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(agentOpenApiDocument(), {
    headers: {
      // ChatGPT fetches this cross-origin from its own configuration UI.
      // Read-only, no credentials, no data — the one place on the agent surface
      // where a wildcard origin is correct.
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
