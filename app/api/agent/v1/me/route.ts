import { NextResponse } from 'next/server';
import { authenticateAgent, type AgentAuthFailure } from '@/app/lib/agent/auth';

/**
 * GET /api/agent/v1/me — who am I, and what may I do?
 *
 * The first and smallest endpoint of the agent surface. It exists so a Custom
 * GPT or a CLI can prove its key works before anything is at stake, and so this
 * PR's authentication is verifiable rather than merely written. The rest of the
 * surface (reading leads and cases, filing proposals) is R4b-3.
 *
 * Server-to-server only: no CORS headers, so a browser on another origin cannot
 * read the response even if a key leaked into one.
 */

export const dynamic = 'force-dynamic';

/**
 * One message per failure, chosen so the holder of a legitimate key can fix
 * their own problem, while an attacker probing keys learns nothing about which
 * guesses were close. 'unknown_key' and 'missing_credentials' deliberately say
 * the same thing.
 */
const FAILURE_MESSAGE: Record<AgentAuthFailure, string> = {
  missing_credentials: 'Provide your API key as: Authorization: Bearer <key>',
  unknown_key: 'Provide your API key as: Authorization: Bearer <key>',
  revoked: 'This API key has been revoked.',
  expired: 'This API key has expired. An administrator can issue a new one.',
  employee_inactive: 'The AI employee this key belongs to is no longer active.',
  employee_paused: 'The AI employee this key belongs to is paused.',
  not_external: 'This key does not belong to an external AI employee.',
  rate_limited: 'Too many requests. Slow down and try again shortly.',
  lookup_failed: 'The service is temporarily unavailable. Try again shortly.',
};

export async function GET(request: Request) {
  const auth = await authenticateAgent(request);

  if (!auth.ok) {
    const body: Record<string, string> = {
      error: auth.reason,
      message: FAILURE_MESSAGE[auth.reason],
    };
    const headers: Record<string, string> = {};
    if (auth.status === 401) headers['WWW-Authenticate'] = 'Bearer';
    return NextResponse.json(body, { status: auth.status, headers });
  }

  const p = auth.principal;
  return NextResponse.json({
    // The identity is the AI EMPLOYEE. There is no admin here, and no way for a
    // key to act as a human.
    employee: { id: p.aiProfileId, name: p.aiName, route: p.employmentType },
    key: { id: p.keyId, label: p.keyLabel, scopes: p.scopes },
    // Stated in the response so an agent reading this endpoint learns the rule
    // rather than discovering it by being refused later.
    rules: {
      read: 'See internal work: leads, cases, tasks, clients, document names. Never file contents.',
      write: 'Change internal work only. Nothing a customer can see.',
      propose:
        'Anything a customer can see is filed as a proposal and takes effect only once a human approves it.',
      never: 'You cannot contact a customer, and you have no administrator access.',
    },
  });
}
