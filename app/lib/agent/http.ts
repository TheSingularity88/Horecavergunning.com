import 'server-only';

import { NextResponse } from 'next/server';
import type { AgentAuthFailure, AgentAuthResult } from '@/app/lib/agent/auth';

/**
 * Turning an authentication refusal into a response.
 *
 * Shared so every agent route answers identically. One message per failure,
 * chosen so the holder of a legitimate key can fix their own problem while an
 * attacker probing keys learns nothing: 'unknown_key' and 'missing_credentials'
 * deliberately say the same thing.
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

export function agentAuthResponse(auth: Extract<AgentAuthResult, { ok: false }>): NextResponse {
  const headers: Record<string, string> = {};
  if (auth.status === 401) headers['WWW-Authenticate'] = 'Bearer';
  return NextResponse.json(
    { error: auth.reason, message: FAILURE_MESSAGE[auth.reason] },
    { status: auth.status, headers },
  );
}
