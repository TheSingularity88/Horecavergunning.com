'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { mintAgentKeySchema, revokeAgentKeySchema } from '@/app/lib/validation/agent-keys';
import { mintKey } from '@/app/lib/agent/keys';
import { buildAgentInstructions } from '@/app/lib/agent/gpt-instructions';

/**
 * Admin management of the INBOUND keys an external AI employee uses to reach
 * this platform.
 *
 * ai_api_keys is deny-all at RLS, so every read and write here goes through the
 * service-role client behind requireAdmin. The plaintext key exists for exactly
 * one response and is never stored, logged, or returned again.
 */

export interface AgentKeyView {
  id: string;
  label: string;
  aiProfileId: string;
  aiName: string;
  /** Clean prefix; the UI appends the ellipsis. Never the secret. */
  keyPrefix: string;
  scopes: string[];
  expiresAt: string;
  isExpired: boolean;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  requestCount: number;
  revokedAt: string | null;
  createdAt: string;
}

/** Every key, newest first, with the employee it acts as. */
export async function getAgentKeys(): Promise<ActionResult<{ keys: AgentKeyView[] }>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    // Explicit column list, and key_hash is deliberately not in it. The hash
    // never needs to cross the wire, and a select('*') would put it in a
    // client component's props.
    const [keysResult, profilesResult] = await Promise.all([
      admin
        .from('ai_api_keys')
        .select(
          'id, label, ai_profile_id, key_prefix, scopes, expires_at, last_used_at, last_used_ip, request_count, revoked_at, created_at',
        )
        .order('created_at', { ascending: false }),
      admin.from('profiles').select('id, full_name').eq('role', 'ai'),
    ]);

    if (keysResult.error || profilesResult.error) {
      console.error(
        '[agent-keys] load failed:',
        keysResult.error?.message ?? profilesResult.error?.message,
      );
      return { success: false, error: 'Could not load the API keys.' };
    }

    const nameById = new Map(
      ((profilesResult.data as { id: string; full_name: string }[]) || []).map((p) => [
        p.id,
        p.full_name,
      ]),
    );
    const now = Date.now();

    const keys: AgentKeyView[] = (
      (keysResult.data as
        | {
            id: string;
            label: string;
            ai_profile_id: string;
            key_prefix: string;
            scopes: string[];
            expires_at: string;
            last_used_at: string | null;
            last_used_ip: string | null;
            request_count: number;
            revoked_at: string | null;
            created_at: string;
          }[]
        | null) || []
    ).map((k) => ({
      id: k.id,
      label: k.label,
      aiProfileId: k.ai_profile_id,
      aiName: nameById.get(k.ai_profile_id) ?? 'Unknown',
      keyPrefix: k.key_prefix,
      scopes: k.scopes,
      expiresAt: k.expires_at,
      isExpired: new Date(k.expires_at).getTime() <= now,
      lastUsedAt: k.last_used_at,
      lastUsedIp: k.last_used_ip,
      requestCount: k.request_count,
      revokedAt: k.revoked_at,
      createdAt: k.created_at,
    }));

    return { success: true, data: { keys } };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Mint a key. The plaintext comes back ONCE, in this response, and is then
 * unrecoverable — we store only its sha256.
 */
export async function mintAgentKey(
  input: unknown,
): Promise<ActionResult<{ token: string; label: string; keyPrefix: string; expiresAt: string }>> {
  try {
    const { profile } = await requireAdmin();
    const parsed = mintAgentKeySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const data = parsed.data;

    const admin = createAdminClient();

    // Check the employee here so the admin gets a sentence instead of a
    // constraint violation. The database trigger is the real boundary and
    // still fires — this is the message, not the guarantee.
    const [{ data: employee }, { data: config }] = await Promise.all([
      admin
        .from('profiles')
        .select('id, full_name, role, is_active')
        .eq('id', data.aiProfileId)
        .maybeSingle(),
      admin
        .from('ai_employee_config')
        .select('employment_type')
        .eq('profile_id', data.aiProfileId)
        .maybeSingle(),
    ]);

    const p = employee as { full_name: string; role: string; is_active: boolean } | null;
    const c = config as { employment_type: string } | null;
    if (!p || !c || p.role !== 'ai') {
      return { success: false, error: 'That AI employee does not exist.' };
    }
    if (c.employment_type !== 'external') {
      return {
        success: false,
        error:
          'Only an AI employee that works through its own API key (route 2) can hold one. This one runs on our provider key.',
      };
    }
    if (!p.is_active) {
      return { success: false, error: 'That AI employee is deactivated.' };
    }

    const minted = mintKey();
    const expiresAt = new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString();

    const { data: created, error } = await admin
      .from('ai_api_keys')
      .insert({
        ai_profile_id: data.aiProfileId,
        label: data.label,
        key_hash: minted.hash,
        key_prefix: minted.prefix,
        scopes: data.scopes,
        expires_at: expiresAt,
        created_by: profile.id,
      })
      .select('id')
      .single();

    if (error || !created) {
      console.error('[agent-keys] mint failed:', error?.message);
      return { success: false, error: 'Could not create the API key.' };
    }

    // The prefix and the scopes are recorded; the secret is not, and neither is
    // its hash — an activity row is not the place to put either.
    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'agent_api_key_minted',
      entity_type: 'ai_api_keys',
      entity_id: (created as { id: string }).id,
      details: {
        label: data.label,
        ai_profile_id: data.aiProfileId,
        ai_name: p.full_name,
        scopes: data.scopes,
        key_prefix: minted.prefix,
        expires_at: expiresAt,
      },
    });

    return {
      success: true,
      data: {
        token: minted.token,
        label: data.label,
        keyPrefix: minted.prefix,
        expiresAt,
      },
    };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Revoke a key. Soft — the row stays, so its usage history stays answerable —
 * and the revocation is VERIFIED rather than assumed: the update is conditional
 * on the key still being live, and a zero-row result is reported as such.
 */
export async function revokeAgentKey(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = revokeAgentKeySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid request.' };

    const admin = createAdminClient();
    const { data: revoked, error } = await admin
      .from('ai_api_keys')
      .update({ revoked_at: new Date().toISOString(), revoked_by: profile.id })
      .eq('id', parsed.data.id)
      .is('revoked_at', null)
      .select('id, label, key_prefix')
      .maybeSingle();

    if (error) {
      console.error('[agent-keys] revoke failed:', error.message);
      return { success: false, error: 'Could not revoke the API key.' };
    }
    if (!revoked) {
      // Either gone or already revoked. Say so — "success" on a revoke that
      // revoked nothing is the worst possible answer to give about a key you
      // believe you have just switched off.
      return { success: false, error: 'That key is already revoked, or no longer exists.' };
    }

    const row = revoked as { id: string; label: string; key_prefix: string };
    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'agent_api_key_revoked',
      entity_type: 'ai_api_keys',
      entity_id: row.id,
      details: { label: row.label, key_prefix: row.key_prefix },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * The system prompt an admin pastes into their Custom GPT.
 *
 * A server action rather than a constant the page imports, because the text is
 * generated from the tool registry and registry.ts is 'server-only' — the same
 * reason the OpenAPI document is built server-side. Admin-guarded like the rest
 * of this file: the prompt is not a secret, but it names the entire external
 * surface, so it belongs behind the same door as the keys it is used with.
 */
export async function getAgentInstructions(): Promise<ActionResult<{ instructions: string }>> {
  try {
    await requireAdmin();
    return { success: true, data: { instructions: buildAgentInstructions() } };
  } catch (err) {
    return toActionError(err);
  }
}
