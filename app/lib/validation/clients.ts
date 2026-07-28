import { z } from 'zod';

/**
 * Creating a client record.
 *
 * Every `use server` export is a POST endpoint, so this is validated even
 * though only staff can reach the screen it backs. The page previously wrote
 * straight to the table from the browser with no schema at all — an empty
 * company name or a 10,000-character note went in unchallenged.
 */
export const createClientSchema = z.object({
  company_name: z.string().trim().min(2, 'Company name: enter at least 2 characters.').max(160),
  contact_name: z.string().trim().min(2, 'Contact name: enter at least 2 characters.').max(160),
  email: z.string().trim().email('Email: enter a valid email address.').max(255),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  postal_code: z.string().trim().max(20).optional().or(z.literal('')),
  kvk_number: z.string().trim().max(20).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  // Mirrors the clients_status_check constraint.
  status: z.enum(['active', 'inactive', 'pending']),
});
export type CreateClientInput = z.infer<typeof createClientSchema>;
