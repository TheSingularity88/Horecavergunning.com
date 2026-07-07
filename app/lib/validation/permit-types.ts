import { z } from 'zod';

export const permitTypeSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase letters, numbers, - or _'),
  name_nl: z.string().trim().min(2).max(160),
  name_en: z.string().trim().min(2).max(160),
  description_nl: z.string().trim().max(1000).optional().or(z.literal('')),
  description_en: z.string().trim().max(1000).optional().or(z.literal('')),
  // Fee entered in euros in the UI; converted to cents in the action.
  fee_euros: z.number().min(0).max(100000),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(9999).default(0),
});
export type PermitTypeInput = z.infer<typeof permitTypeSchema>;

export const requiredDocInputSchema = z.object({
  id: z.string().uuid().optional(),
  name_nl: z.string().trim().min(2).max(200),
  name_en: z.string().trim().min(2).max(200),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(9999).default(0),
});

export const saveRequiredDocsSchema = z.object({
  permitTypeId: z.string().uuid(),
  documents: z.array(requiredDocInputSchema).max(50),
});
export type SaveRequiredDocsInput = z.infer<typeof saveRequiredDocsSchema>;
