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

/** Filters for the tool-call audit trail. */
export const toolCallQuerySchema = z.object({
  page: z.number().int().min(0, 'page must be 0 or greater').max(1000).default(0),
  aiProfileId: z.uuid('aiProfileId must be a valid id').optional(),
  /** The permission tier — the reason this record exists. */
  access: z.enum(['read', 'write', 'propose']).optional(),
  /** 'failed' is the interesting filter: what the AI tried and could not do. */
  outcome: z.enum(['ok', 'failed']).optional(),
});
