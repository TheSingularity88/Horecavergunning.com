import { z } from 'zod';

/**
 * Every `use server` export is a POST endpoint, so these are validated even
 * though only an admin can reach them.
 */

export const AGENT_SCOPES = ['read', 'write', 'propose'] as const;
export type AgentScope = (typeof AGENT_SCOPES)[number];

/** Bounds on how long a minted key may live. No immortal keys. */
export const MIN_KEY_DAYS = 1;
export const MAX_KEY_DAYS = 365;
export const DEFAULT_KEY_DAYS = 90;

export const mintAgentKeySchema = z.object({
  aiProfileId: z.string().uuid('Choose which AI employee this key acts as.'),
  label: z
    .string()
    .trim()
    .min(2, 'Label: name the tool that will hold this key, e.g. "Nova in Claude Code".')
    .max(80, 'Label: too long.'),
  scopes: z
    .array(z.enum(AGENT_SCOPES))
    .min(1, 'Choose at least one permission.')
    // A key cannot be broader than the tiers that exist, and duplicates would
    // survive the CHECK while making the UI lie about what was granted.
    .max(AGENT_SCOPES.length)
    .refine((s) => new Set(s).size === s.length, 'Permissions must not repeat.'),
  expiresInDays: z
    .number()
    .int()
    .min(MIN_KEY_DAYS, 'A key must be valid for at least one day.')
    .max(MAX_KEY_DAYS, 'A key may not be valid for more than a year.'),
});
export type MintAgentKeyInput = z.infer<typeof mintAgentKeySchema>;

export const revokeAgentKeySchema = z.object({
  id: z.string().uuid(),
});
