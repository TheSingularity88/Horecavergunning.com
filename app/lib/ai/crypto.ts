import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigurationError } from '@/app/lib/errors';

/**
 * At-rest encryption for provider API keys (ai_providers.encrypted_key).
 *
 * AES-256-GCM with a fresh 12-byte IV per encryption; the auth tag makes any
 * tampering with the ciphertext detectable at decrypt time. Stored format:
 *
 *   v1:<iv b64>:<tag b64>:<ciphertext b64>
 *
 * The version prefix exists so a future algorithm change can coexist with old
 * rows. The 32-byte key comes from AI_KEY_ENCRYPTION_SECRET (base64), which
 * lives only in the server environment — so a database leak alone does not
 * expose provider keys, and an env leak alone exposes no ciphertexts.
 *
 * Decryption happens in exactly one place (the provider factory); plaintext
 * keys never appear in ActionResults, logs, or the client.
 */

function encryptionKey(): Buffer {
  const secret = process.env.AI_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new ConfigurationError(
      'AI_KEY_ENCRYPTION_SECRET is missing or empty. Provider keys cannot be stored or read without it.',
    );
  }
  const key = Buffer.from(secret, 'base64');
  if (key.length !== 32) {
    throw new ConfigurationError(
      'AI_KEY_ENCRYPTION_SECRET must be 32 bytes of base64 (generate with: openssl rand -base64 32).',
    );
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  const [version, ivB64, tagB64, dataB64] = stored.split(':');
  if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Unrecognized encrypted key format.');
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
