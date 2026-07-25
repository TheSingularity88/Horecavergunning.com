import { z } from 'zod';

export const reviewRequestSchema = z.object({
  requestId: z.string().uuid(),
});
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;

export const newClientRequestSchema = z.object({
  permit_type_id: z.string().uuid().nullable().optional(),
  request_type: z.enum([
    'exploitatievergunning',
    'alcoholvergunning',
    'terrasvergunning',
    'bibob',
    'overname',
    'verbouwing',
    'other',
  ]),
  title: z.string().trim().min(3, 'Title is too short').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  municipality: z.string().trim().max(120).optional().or(z.literal('')),
  urgency: z.enum(['normal', 'urgent']).default('normal'),
});
export type NewClientRequestInput = z.infer<typeof newClientRequestSchema>;
