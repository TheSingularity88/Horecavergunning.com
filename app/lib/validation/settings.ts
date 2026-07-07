import { z } from 'zod';

export const settingEntrySchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Setting keys are snake_case'),
  value: z.string().max(2000),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const saveSettingsSchema = z.object({
  settings: z.array(settingEntrySchema).min(1).max(50),
});
export type SaveSettingsInput = z.infer<typeof saveSettingsSchema>;
