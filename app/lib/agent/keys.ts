import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Minting and recognising INBOUND agent keys.
 *
 * Deliberately separate from app/lib/ai/crypto.ts, which encrypts OUTBOUND
 * provider keys with reversible AES-256-GCM because we must decrypt those to
 * call Anthropic. Here we never need the original back — only to recognise one
 * that is presented — so the stored form is a one-way hash and a leak of the
 * table yields nothing usable.
 */

/**
 * `hv_ai_` + 32 CSPRNG bytes as hex = 256 bits of entropy.
 *
 * The brand prefix is not decoration: it makes a leaked key greppable in logs
 * and recognisable to secret scanners. The reference implementation used 192
 * bits, which is ample — but since the whole security of an unsalted sha256
 * rests on the token being unguessable, there is no reason to be frugal here.
 */
const KEY_BRAND = 'hv_ai_';
const KEY_BYTES = 32;

/** Characters of the secret kept in the clear for display. */
const PREFIX_CHARS = 8;

export interface MintedKey {
  /** The full secret. Returned to the admin ONCE and never stored. */
  token: string;
  /** What goes in the database. */
  hash: string;
  /** Display only — brand + a short slice, with no ellipsis baked in. */
  prefix: string;
}

export function mintKey(): MintedKey {
  const token = `${KEY_BRAND}${randomBytes(KEY_BYTES).toString('hex')}`;
  return {
    token,
    hash: hashKey(token),
    // Stored clean so it stays QUERYABLE — usable to narrow a lookup or to
    // attribute a key found in someone's logs. The reference implementation
    // baked a '…' into this column, which made it a string that only a human
    // could read. The UI appends the ellipsis.
    prefix: token.slice(0, KEY_BRAND.length + PREFIX_CHARS),
  };
}

/** sha256 hex. Same function at mint time and at verify time, by construction. */
export function hashKey(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Pull the bearer token out of an Authorization header.
 *
 * Returns null for anything malformed rather than throwing, so a caller can
 * treat "no credentials" and "bad credentials" the same way — which it should,
 * since telling them apart is free reconnaissance.
 */
export function parseBearer(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

/**
 * Constant-time comparison of two hex digests.
 *
 * The database lookup is the real matcher, so this exists for paths that
 * compare a digest in application code. Lengths are compared first via a
 * padded buffer rather than an early return: `a.length === b.length` before a
 * constant-time compare leaks the length through timing, which is the flaw in
 * the implementation this was modelled on.
 */
export function digestsEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  const size = Math.max(bufA.length, bufB.length, 1);
  const padA = Buffer.alloc(size);
  const padB = Buffer.alloc(size);
  bufA.copy(padA);
  bufB.copy(padB);
  // The length check still has to happen — it just happens AFTER the
  // constant-time compare, so it cannot short-circuit anything.
  return timingSafeEqual(padA, padB) && bufA.length === bufB.length;
}

/** Display form: `hv_ai_a1b2c3d4…`. The ellipsis lives here, not in the column. */
export function displayPrefix(prefix: string): string {
  return `${prefix}…`;
}
