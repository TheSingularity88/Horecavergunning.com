import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(254),
  full_name: z.string().trim().min(2, 'Name is too short').max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
  role: z.enum(['employee', 'admin']),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const changeRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['employee', 'admin']),
});
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

export const setActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});
export type SetActiveInput = z.infer<typeof setActiveSchema>;
