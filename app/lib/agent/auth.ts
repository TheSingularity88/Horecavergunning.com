import 'server-only';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { checkRateLimitStrict, clientIp } from '@/app/lib/rate-limit';
import { hashKey, parseBearer } from '@/app/lib/agent/keys';
import type { AiEmploymentType } from '@/app/lib/types/database';

/**
 * Authenticating an inbound request from an external AI employee.
 *
 * The one design decision everything else follows from: a key authenticates AS
 * THE AI EMPLOYEE IT BELONGS TO. The reference implementation this was modelled
 * on returns the id of the ADMIN who minted the key, and falls back to "the
 * oldest admin in the table" when it cannot tell — so an agent's writes land
 * under a human who never made them. That is unusable here, where the owner's
 * requirement is that every AI employee is clearly marked and no AI holds admin
 * access.
 *
 * There is deliberately NO environment-variable bootstrap key. The reference
 * has one; it is invisible in the dashboard, cannot be revoked without a
 * redeploy, and would be marked as nothing.
 */

export type AgentAuthFailure =
  | 'missing_credentials'
  | 'unknown_key'
  | 'revoked'
  | 'expired'
  | 'employee_inactive'
  | 'employee_paused'
  | 'not_external'
  | 'rate_limited'
  | 'lookup_failed';

export interface AgentPrincipal {
  keyId: string;
  keyLabel: string;
  /** The AI employee this key acts as. Never an admin, never a human. */
  aiProfileId: string;
  aiName: string;
  employmentType: AiEmploymentType;
  /** Mirrors the tool tiers: read / write / propose. */
  scopes: string[];
  ip: string;
  userAgent: string | null;
}

export type AgentAuthResult =
  | { ok: true; principal: AgentPrincipal }
  | { ok: false; reason: AgentAuthFailure; status: 401 | 403 | 429 | 503 };

/** Requests per minute per key. Fail-closed: a limiter outage denies. */
const RATE_LIMIT_PER_MINUTE = 60;

/** Failed attempts per minute per IP, so a stolen-key hunt is not free. */
const FAILURE_LIMIT_PER_MINUTE = 20;

/**
 * How stale last_used_at may get before we write it again.
 *
 * The reference implementation awaited an UPDATE on every single authenticated
 * request. For an agent driving a dashboard that is a write per read, all
 * contending on one row. A minute of resolution is plenty for "when did this
 * key last work", and the request counter is incremented in the same write.
 */
const LAST_USED_REFRESH_MS = 60_000;

export async function authenticateAgent(request: Request): Promise<AgentAuthResult> {
  const admin = createAdminClient();
  const ip = clientIp(request.headers);
  const userAgent = request.headers.get('user-agent');

  const token = parseBearer(request.headers.get('authorization'));
  if (!token) {
    await recordFailure(admin, 'missing_credentials', ip, userAgent, null);
    return { ok: false, reason: 'missing_credentials', status: 401 };
  }

  // Throttle FAILURES by IP before doing any lookup work, so guessing costs
  // the attacker something even when every guess is wrong.
  const failureBudget = await checkRateLimitStrict(
    `agent-auth-fail:${ip}`,
    FAILURE_LIMIT_PER_MINUTE,
    60,
  );
  if (!failureBudget) {
    await recordFailure(admin, 'rate_limited', ip, userAgent, null);
    return { ok: false, reason: 'rate_limited', status: 429 };
  }

  // Look up by hash. Revoked keys are matched too, so a revoked key can be
  // reported as revoked rather than as unknown — the holder is someone we
  // deliberately cut off, and the audit line should say so.
  const { data: key, error } = await admin
    .from('ai_api_keys')
    .select('id, label, ai_profile_id, scopes, expires_at, revoked_at, last_used_at, request_count')
    .eq('key_hash', hashKey(token))
    .maybeSingle();

  if (error) {
    // Fail closed. An outage must not become an open door.
    console.error('[agent-auth] key lookup failed:', error.message);
    await recordFailure(admin, 'lookup_failed', ip, userAgent, null);
    return { ok: false, reason: 'lookup_failed', status: 503 };
  }
  if (!key) {
    await recordFailure(admin, 'unknown_key', ip, userAgent, null);
    return { ok: false, reason: 'unknown_key', status: 401 };
  }

  const row = key as {
    id: string;
    label: string;
    ai_profile_id: string;
    scopes: string[];
    expires_at: string;
    revoked_at: string | null;
    last_used_at: string | null;
    request_count: number;
  };

  if (row.revoked_at) {
    await recordFailure(admin, 'revoked', ip, userAgent, row.id);
    return { ok: false, reason: 'revoked', status: 401 };
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await recordFailure(admin, 'expired', ip, userAgent, row.id);
    return { ok: false, reason: 'expired', status: 401 };
  }

  // The employee behind the key must still be a live, external, unpaused AI.
  // Checked on every request rather than trusted from mint time: pausing an
  // employee has to stop its agent, and deactivating the account has to too.
  const [{ data: profile }, { data: config }] = await Promise.all([
    admin.from('profiles').select('id, full_name, role, is_active').eq('id', row.ai_profile_id).maybeSingle(),
    admin
      .from('ai_employee_config')
      .select('employment_type, is_paused')
      .eq('profile_id', row.ai_profile_id)
      .maybeSingle(),
  ]);

  const p = profile as { full_name: string; role: string; is_active: boolean } | null;
  const c = config as { employment_type: AiEmploymentType; is_paused: boolean } | null;

  if (!p || !c || p.role !== 'ai' || !p.is_active) {
    await recordFailure(admin, 'employee_inactive', ip, userAgent, row.id);
    return { ok: false, reason: 'employee_inactive', status: 403 };
  }
  if (c.employment_type !== 'external') {
    // Unreachable while the mint-time trigger holds, and checked anyway: this
    // is the boundary, not the form that fills it.
    await recordFailure(admin, 'not_external', ip, userAgent, row.id);
    return { ok: false, reason: 'not_external', status: 403 };
  }
  if (c.is_paused) {
    await recordFailure(admin, 'employee_paused', ip, userAgent, row.id);
    return { ok: false, reason: 'employee_paused', status: 403 };
  }

  const withinRate = await checkRateLimitStrict(`agent-key:${row.id}`, RATE_LIMIT_PER_MINUTE, 60);
  if (!withinRate) {
    await recordFailure(admin, 'rate_limited', ip, userAgent, row.id);
    return { ok: false, reason: 'rate_limited', status: 429 };
  }

  await touchKey(admin, row, ip, userAgent);

  return {
    ok: true,
    principal: {
      keyId: row.id,
      keyLabel: row.label,
      aiProfileId: row.ai_profile_id,
      aiName: p.full_name,
      employmentType: c.employment_type,
      scopes: row.scopes,
      ip,
      userAgent,
    },
  };
}

/** Does this key carry the tier a tool needs? */
export function hasScope(principal: AgentPrincipal, scope: 'read' | 'write' | 'propose'): boolean {
  return principal.scopes.includes(scope);
}

/**
 * Stamp usage, but not on every request — see LAST_USED_REFRESH_MS. Never
 * awaited into the failure path: a usage stamp that fails must not deny an
 * otherwise valid request.
 */
async function touchKey(
  admin: ReturnType<typeof createAdminClient>,
  row: { id: string; last_used_at: string | null; request_count: number },
  ip: string,
  userAgent: string | null,
): Promise<void> {
  const last = row.last_used_at ? new Date(row.last_used_at).getTime() : 0;
  if (Date.now() - last < LAST_USED_REFRESH_MS) return;
  try {
    await admin
      .from('ai_api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        last_used_ip: ip,
        last_used_ua: userAgent ? userAgent.slice(0, 300) : null,
        request_count: row.request_count + 1,
      })
      .eq('id', row.id);
  } catch (err) {
    console.error('[agent-auth] could not stamp key usage:', err);
  }
}

/**
 * EVERY failed authentication is logged.
 *
 * The reference implementation logs nothing at all on failure — no console
 * line, no audit row, no counter — so a leaked key being probed is completely
 * invisible. These rows are what makes "someone is trying keys against us"
 * answerable.
 */
async function recordFailure(
  admin: ReturnType<typeof createAdminClient>,
  reason: AgentAuthFailure,
  ip: string,
  userAgent: string | null,
  keyId: string | null,
): Promise<void> {
  try {
    await admin.from('activity_log').insert({
      // No user_id: nobody authenticated. Attributing this to a person would
      // be a lie, and to the key's owner would be worse — the whole point of a
      // failure is that we do not know who sent it.
      user_id: null,
      action: 'agent_auth_failed',
      entity_type: 'ai_api_keys',
      entity_id: keyId,
      details: { reason, ip, user_agent: userAgent ? userAgent.slice(0, 300) : null },
    });
  } catch (err) {
    console.error('[agent-auth] could not record failed authentication:', err);
  }
}
