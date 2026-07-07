import 'server-only';

import createMollieClient, { type MollieClient } from '@mollie/api-client';

let cached: MollieClient | null = null;

/** Server-only Mollie client. Returns null if no key is configured. */
export function getMollie(): MollieClient | null {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return null;
  if (!cached) cached = createMollieClient({ apiKey });
  return cached;
}

/** Mollie expects the amount as a fixed 2-decimal string, e.g. "495.00". */
export function centsToMollieAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
