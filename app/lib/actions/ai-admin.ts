'use server';

import { randomBytes } from 'crypto';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import { encryptSecret } from '@/app/lib/ai/crypto';
import {
  saveProviderSchema,
  providerIdSchema,
  createAiEmployeeSchema,
  updateAiEmployeeSchema,
} from '@/app/lib/validation/ai-admin';
import type { AiEmployeeConfig, AiProviderName } from '@/app/lib/types/database';

/**
 * Admin management of AI providers (Route 1 API keys) and AI employees.
 * ADMIN ONLY — every export self-guards. The ai_providers and
 * ai_employee_config tables are deny-all at RLS, so ALL reads and writes go
 * through here; nothing about a provider key ever reaches the browser except
 * its display prefix.
 */

export interface AiProviderView {
  id: string;
  provider: AiProviderName;
  label: string;
  key_prefix: string;
  default_model: string;
  is_active: boolean;
  created_at: string;
}

export interface AiEmployeeView {
  profile_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  config: Pick<
    AiEmployeeConfig,
    'provider_id' | 'model' | 'job_description' | 'max_runs_per_day' | 'is_paused'
  >;
}

/** Everything the admin AI page needs, in one call (tables are deny-all). */
export async function getAiAdminData(): Promise<
  ActionResult<{ providers: AiProviderView[]; employees: AiEmployeeView[] }>
> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const [{ data: providers }, { data: configs }, { data: profiles }] = await Promise.all([
      admin
        .from('ai_providers')
        .select('id, provider, label, key_prefix, default_model, is_active, created_at')
        .order('created_at'),
      admin.from('ai_employee_config').select('*'),
      admin.from('profiles').select('id, full_name, email, is_active').eq('role', 'ai'),
    ]);

    const configByProfile = new Map(
      ((configs as AiEmployeeConfig[]) || []).map((c) => [c.profile_id, c]),
    );

    return {
      success: true,
      data: {
        providers: (providers as AiProviderView[]) || [],
        employees: ((profiles as { id: string; full_name: string; email: string; is_active: boolean }[]) || [])
          .map((p) => {
            const config = configByProfile.get(p.id);
            if (!config) return null;
            return {
              profile_id: p.id,
              full_name: p.full_name,
              email: p.email,
              is_active: p.is_active,
              config: {
                provider_id: config.provider_id,
                model: config.model,
                job_description: config.job_description,
                max_runs_per_day: config.max_runs_per_day,
                is_paused: config.is_paused,
              },
            };
          })
          .filter((e): e is AiEmployeeView => e !== null),
      },
    };
  } catch (err) {
    return toActionError(err);
  }
}

/** Store a provider API key (encrypted at rest). The plaintext never returns. */
export async function saveAiProvider(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = saveProviderSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const data = parsed.data;

    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from('ai_providers')
      .insert({
        provider: data.provider,
        label: data.label,
        encrypted_key: encryptSecret(data.api_key),
        key_prefix: `${data.api_key.slice(0, 12)}…`,
        default_model: data.default_model,
        created_by: profile.id,
      })
      .select('id')
      .single();
    if (error || !inserted) {
      return { success: false, error: 'Could not save the provider key.' };
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'ai_provider_created',
      entity_type: 'ai_providers',
      entity_id: inserted.id,
      // Never the key itself — not even encrypted — in the audit trail.
      details: { provider: data.provider, label: data.label, model: data.default_model },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Deactivate a provider key (soft: rows referencing it stay intact). */
export async function deactivateAiProvider(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = providerIdSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid provider id' };

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('ai_providers')
      .update({ is_active: false })
      .eq('id', parsed.data.id)
      .select('id, label')
      .maybeSingle();
    if (error) return { success: false, error: 'Could not deactivate the provider.' };
    if (!updated) return { success: false, error: 'Provider not found.' };

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'ai_provider_deactivated',
      entity_type: 'ai_providers',
      entity_id: updated.id,
      details: { label: updated.label },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Create an AI employee: a real auth user + profile with role='ai', plus its
 * config row. Clones the createStaffUser seam, with two differences that ARE
 * the security model: the password is 64 random bytes discarded immediately
 * (the account can never log in — and even with a session, middleware and
 * requireStaff both reject role 'ai'), and the role promotion goes to 'ai',
 * never 'employee'/'admin'.
 */
export async function createAiEmployee(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = createAiEmployeeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const data = parsed.data;

    const admin = createAdminClient();

    // The provider must exist and be active — an AI without a working
    // provider would be created broken.
    const { data: provider } = await admin
      .from('ai_providers')
      .select('id, is_active')
      .eq('id', data.provider_id)
      .maybeSingle();
    if (!provider || !provider.is_active) {
      return { success: false, error: 'Choose an active AI provider first.' };
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const email = `ai-${slug}@horecavergunning.com`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      // 48 bytes -> 64 base64 chars. Must stay under the 72-character bcrypt
      // limit Supabase enforces; 64 random bytes base64-encodes to 88 and is
      // rejected. 384 bits of entropy is far more than enough for a password
      // that is discarded on the next line and never used to log in.
      password: randomBytes(48).toString('base64'),
      email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (createError || !created.user) {
      // Log the provider's own message: without it this surfaces as a generic
      // "could not create" with no way to tell a duplicate from a policy
      // rejection.
      console.error('[ai-admin] createUser failed:', createError?.message);
      return {
        success: false,
        error: createError?.message.includes('already')
          ? 'An AI employee with this name already exists.'
          : `Could not create the AI account: ${createError?.message ?? 'unknown error'}`,
      };
    }

    // handle_new_user created the profile as employee/inactive; promote to
    // the AI role. If this fails, remove the auth user so nothing is left
    // half-created.
    const { error: promoteError } = await admin
      .from('profiles')
      .update({ role: 'ai', is_active: true, full_name: data.name })
      .eq('id', created.user.id);
    if (promoteError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { success: false, error: 'Could not configure the AI account.' };
    }

    const { error: configError } = await admin.from('ai_employee_config').insert({
      profile_id: created.user.id,
      provider_id: data.provider_id,
      model: data.model,
      job_description: data.job_description,
      max_runs_per_day: data.max_runs_per_day,
    });
    if (configError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { success: false, error: 'Could not configure the AI account.' };
    }

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'ai_employee_created',
      entity_type: 'profiles',
      entity_id: created.user.id,
      details: { name: data.name, max_runs_per_day: data.max_runs_per_day },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Update an AI employee's configuration (job, provider, limits, pause). */
export async function updateAiEmployee(input: unknown): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const parsed = updateAiEmployeeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const data = parsed.data;

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('ai_employee_config')
      .update({
        provider_id: data.provider_id,
        model: data.model,
        job_description: data.job_description,
        max_runs_per_day: data.max_runs_per_day,
        is_paused: data.is_paused,
      })
      .eq('profile_id', data.profile_id)
      .select('profile_id')
      .maybeSingle();
    if (error) return { success: false, error: 'Could not save the AI employee.' };
    if (!updated) return { success: false, error: 'AI employee not found.' };

    await admin.from('activity_log').insert({
      user_id: profile.id,
      action: 'ai_employee_updated',
      entity_type: 'profiles',
      entity_id: data.profile_id,
      details: { is_paused: data.is_paused, max_runs_per_day: data.max_runs_per_day },
    });

    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}
