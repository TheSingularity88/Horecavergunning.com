import { z } from 'zod';

// Chat with an AI employee. Every 'use server' export is a POST endpoint, so
// even staff-only inputs get validated.

export const sendChatMessageSchema = z.object({
  aiProfileId: z.uuid('Choose an AI employee.'),
  message: z
    .string()
    .trim()
    .min(1, 'Message: type something first.')
    .max(4000, 'Message: keep it under 4000 characters.'),
});
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

export const chatHistoryQuerySchema = z.object({
  aiProfileId: z.uuid(),
});
