import { z } from 'zod';

// Admin management of AI providers and AI employees.

// Messages name their field: a bare "Too small" tells the user nothing about
// WHICH input to fix, and these errors surface as a toast with no field
// highlighting.
/**
 * Providers with a working client. The DB CHECK and the AiProviderId union both
 * list openai and google, but app/lib/ai/provider.ts throws for them — so
 * accepting one here let an admin store a key, bind an employee to it, and
 * discover the truth only on that employee's first paid run. Keep this list in
 * step with app/lib/ai/providers/.
 */
export const IMPLEMENTED_PROVIDERS = ['anthropic'] as const;

export const saveProviderSchema = z.object({
  provider: z.enum(IMPLEMENTED_PROVIDERS, {
    message: 'Provider: only Anthropic (Claude) is supported right now.',
  }),
  label: z.string().trim().min(2, 'Label: enter at least 2 characters.').max(80),
  // Provider keys are long; a hard cap keeps a paste accident out of the DB.
  api_key: z
    .string()
    .trim()
    .min(20, 'API key: this does not look like a valid key (too short).')
    .max(500, 'API key: too long.'),
  default_model: z.string().trim().min(2, 'Default model: enter a model name.').max(100),
});
export type SaveProviderInput = z.infer<typeof saveProviderSchema>;

export const providerIdSchema = z.object({ id: z.string().uuid() });

/**
 * The two routes take genuinely different inputs, so this is a discriminated
 * union rather than one shape with optional fields. A platform employee MUST
 * name a provider (we call the model for it); an external employee MUST NOT
 * (it brings its own, and a provider_id there would quietly spend our API
 * budget). The database enforces the same pairing — see migration 023 — but
 * the union is what produces a usable error instead of a constraint violation.
 */
const aiEmployeeBase = {
  name: z.string().trim().min(2, 'Name: give the AI employee a name.').max(60),
  job_description: z
    .string()
    .trim()
    .min(10, 'Job description: describe the role in at least a sentence.')
    .max(2000),
  max_runs_per_day: z.number().int().min(1, 'Max runs per day: at least 1.').max(200),
};

export const createAiEmployeeSchema = z.discriminatedUnion('employment_type', [
  z.object({
    ...aiEmployeeBase,
    employment_type: z.literal('platform'),
    provider_id: z.string().uuid('Choose an AI provider.'),
    model: z.string().trim().max(100).nullable(),
  }),
  z.object({
    ...aiEmployeeBase,
    employment_type: z.literal('external'),
  }),
]);
export type CreateAiEmployeeInput = z.infer<typeof createAiEmployeeSchema>;

/**
 * employment_type is absent on purpose: it is fixed at creation and a database
 * trigger refuses to change it, so accepting it here would only invite a
 * request that fails deep in Postgres instead of never being made.
 *
 * provider_id is nullable because an external employee has none — it was
 * `z.string().uuid()`, which meant the admin page's Pause button (which resends
 * the whole config) would reject its own payload for any employee without a
 * provider.
 */
export const updateAiEmployeeSchema = z.object({
  profile_id: z.string().uuid(),
  job_description: z.string().trim().min(10).max(2000),
  provider_id: z.string().uuid().nullable(),
  model: z.string().trim().max(100).nullable(),
  max_runs_per_day: z.number().int().min(1).max(200),
  is_paused: z.boolean(),
});
export type UpdateAiEmployeeInput = z.infer<typeof updateAiEmployeeSchema>;
