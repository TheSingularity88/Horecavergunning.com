'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { requireAdmin, toActionError, type ActionResult } from '@/app/lib/auth/guards';
import {
  createUserSchema,
  changeRoleSchema,
  setActiveSchema,
  type CreateUserInput,
  type ChangeRoleInput,
  type SetActiveInput,
} from '@/app/lib/validation/admin-users';
import type { Json } from '@/app/lib/types/database';

async function logActivity(
  adminId: string,
  action: string,
  entityId: string | null,
  details: Json
) {
  const admin = createAdminClient();
  await admin.from('activity_log').insert({
    user_id: adminId,
    action,
    entity_type: 'profiles',
    entity_id: entityId,
    details,
  });
}

/**
 * Create a staff user (employee/admin). Runs server-side with the service
 * role so the admin's own browser session is untouched (the old client-side
 * signUp used to replace the admin's session with the new user's).
 */
export async function createStaffUser(input: CreateUserInput): Promise<ActionResult> {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const { email, full_name, password, role } = parsed.data;

    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createError) {
      return { success: false, error: createError.message };
    }

    // The signup trigger created the profile as employee/inactive.
    // Promote to the requested role and activate (admin-created = trusted).
    const { error: updateError } = await admin
      .from('profiles')
      .update({ role, is_active: true })
      .eq('id', created.user.id);
    if (updateError) {
      return { success: false, error: 'User created but activation failed. Check the users list.' };
    }

    await logActivity(adminProfile.id, 'staff_user_created', created.user.id, { email, role });
    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Change a staff member's role. Admins cannot demote themselves. */
export async function changeUserRole(input: ChangeRoleInput): Promise<ActionResult> {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const parsed = changeRoleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const { userId, role } = parsed.data;

    if (userId === adminProfile.id && role !== 'admin') {
      return { success: false, error: 'You cannot remove your own admin role.' };
    }

    const admin = createAdminClient();
    const { error } = await admin.from('profiles').update({ role }).eq('id', userId);
    if (error) return { success: false, error: 'Failed to update role.' };

    await logActivity(adminProfile.id, 'staff_role_changed', userId, { role });
    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Activate/deactivate a staff member. Admins cannot deactivate themselves. */
export async function setUserActive(input: SetActiveInput): Promise<ActionResult> {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const parsed = setActiveSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const { userId, isActive } = parsed.data;

    if (userId === adminProfile.id && !isActive) {
      return { success: false, error: 'You cannot deactivate your own account.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    if (error) return { success: false, error: 'Failed to update user status.' };

    await logActivity(adminProfile.id, isActive ? 'staff_activated' : 'staff_deactivated', userId, {});
    return { success: true };
  } catch (err) {
    return toActionError(err);
  }
}
