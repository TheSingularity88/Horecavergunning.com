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
  if (!token) return deny(admin, 'missing_credentials', 401, ip, userAgent, null);

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
    return deny(admin, 'lookup_failed', 503, ip, userAgent, null);
  }
  if (!key) return deny(admin, 'unknown_key', 401, ip, userAgent, null);

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

  if (row.revoked_at) return deny(admin, 'revoked', 401, ip, userAgent, row.id);
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return deny(admin, 'expired', 401, ip, userAgent, row.id);
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
    return deny(admin, 'employee_inactive', 403, ip, userAgent, row.id);
  }
  if (c.employment_type !== 'external') {
    // Unreachable while the mint-time trigger holds, and checked anyway: this
    // is the boundary, not the form that fills it.
    return deny(admin, 'not_external', 403, ip, userAgent, row.id);
  }
  if (c.is_paused) return deny(admin, 'employee_paused', 403, ip, userAgent, row.id);

  const withinRate = await checkRateLimitStrict(`agent-key:${row.id}`, RATE_LIMIT_PER_MINUTE, 60);
  if (!withinRate) return deny(admin, 'rate_limited', 429, ip, userAgent, row.id);

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

/**
 * Refuse, and record it — but only while this IP still has failure budget.
 *
 * The budget is consumed by FAILURES ONLY. An earlier attempt at this checked
 * it at the top of the function for every request, which would have throttled a
 * perfectly good agent after 20 successful calls a minute despite its own,
 * higher, per-key limit.
 *
 * The route is public — middleware.ts exempts /api, so `curl` with no headers
 * is a complete anonymous round trip — and the first version recorded every
 * refusal unconditionally. That let anyone append to the audit log without
 * limit and bury the key-minted and key-revoked entries the log exists to
 * preserve. The first N refusals per minute per IP are the signal worth having;
 * everything past that IS the flood, and is now a console line instead of a row.
 */
async function deny(
  admin: ReturnType<typeof createAdminClient>,
  reason: AgentAuthFailure,
  status: 401 | 403 | 429 | 503,
  ip: string,
  userAgent: string | null,
  keyId: string | null,
): Promise<AgentAuthResult> {
  const withinBudget = await checkRateLimitStrict(
    `agent-auth-fail:${ip}`,
    FAILURE_LIMIT_PER_MINUTE,
    60,
  );
  if (!withinBudget) {
    console.warn(`[agent-auth] failure budget exhausted for ${ip}; suppressing audit row`);
    return { ok: false, reason: 'rate_limited', status: 429 };
  }
  await recordFailure(admin, reason, ip, userAgent, keyId);
  return { ok: false, reason, status };
}

/** Does this key carry the tier a tool needs? */
export function hasScope(principal: AgentPrincipal, scope: 'read' | 'write' | 'propose'): boolean {
  return principal.scopes.includes(scope);
}

/**
 * Record usage in ONE atomic statement.
 *
 * Two things that must not be conflated, and were:
 *   request_count  counts REQUESTS, and is incremented every time. The first
 *                  version incremented it inside a once-a-minute throttle, so
 *                  it silently counted active MINUTES instead — a key driven
 *                  at its 60/min ceiling reported 60 requests per hour rather
 *                  than 3600, understating a hammered key by up to 60x on the
 *                  one screen an admin has for spotting a leaked one.
 *   last_used_*    is the expensive, low-value part, and stays throttled.
 *
 * Doing it in SQL rather than read-then-write also removes a lost update: the
 * count was read before three round trips and written back as count+1, so
 * concurrent requests both wrote the same value.
 *
 * Never awaited into the failure path — a usage stamp that fails must not deny
 * an otherwise valid request.
 */
async function touchKey(
  admin: ReturnType<typeof createAdminClient>,
  row: { id: string },
  ip: string,
  userAgent: string | null,
): Promise<void> {
  try {
    const { error } = await admin.rpc('touch_agent_api_key', {
      p_id: row.id,
      p_ip: ip,
      p_ua: userAgent ? userAgent.slice(0, 300) : null,
      p_stale_seconds: Math.round(LAST_USED_REFRESH_MS / 1000),
    });
    if (error) console.error('[agent-auth] could not stamp key usage:', error.message);
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
