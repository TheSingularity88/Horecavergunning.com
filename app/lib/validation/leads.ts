import { z } from 'zod';

export const leadSchema = z.object({
  source: z.enum(['quiz', 'contact', 'newsletter']),
  name: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email address').max(254),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  company_name: z.string().trim().max(160).optional().or(z.literal('')),
  message: z.string().trim().max(5000).optional().or(z.literal('')),
  permit_type_slug: z.string().trim().max(64).optional().or(z.literal('')),
  quiz_answers: z.record(z.string(), z.unknown()).optional(),
  locale: z.enum(['nl', 'en']).default('nl'),
  // Honeypot: bots fill this hidden field; humans leave it empty. Accept any
  // value here so the route can silently drop bot submissions (a strict schema
  // would 422 and tell the bot which field to fix).
  website: z.string().optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const updateLeadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'converted', 'closed']),
});
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
