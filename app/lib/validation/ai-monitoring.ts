import { z } from 'zod';

/**
 * Every `use server` export is a POST endpoint, so the run-history filters get
 * validated like any other input even though only an admin can reach them.
 */
export const runHistoryQuerySchema = z.object({
  page: z.number().int().min(0, 'page must be 0 or greater').max(1000).default(0),
  aiProfileId: z.uuid('aiProfileId must be a valid id').optional(),
  status: z.enum(['ok', 'error']).optional(),
});
