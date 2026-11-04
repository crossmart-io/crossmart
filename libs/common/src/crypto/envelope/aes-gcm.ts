import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import {
  AUTH_TAG_BYTES,
  CIPHER_ALGORITHM,
  IV_BYTES,
  KEY_BYTES,
  SEALED_ENCODING,
  SEALED_FORMAT_VERSION,
  SEALED_PART_SEPARATOR,
} from './envelope.constants.js';
import { DecryptionError } from './encryption-errors.js';

const SEALED_PART_COUNT = 4;

function assertKey(key: Buffer): void {
  if (key.length !== KEY_BYTES) {
    throw new RangeError(`AES-256-GCM keys are ${KEY_BYTES} bytes`);
  }
}

/**
 * Encrypts `plaintext` with a fresh random IV. `associatedData` is authenticated but not
 * stored: opening the value needs the same context, so a value cannot be replayed elsewhere.
 */
export function sealAesGcm(key: Buffer, plaintext: Buffer, associatedData: string): string {
  assertKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
  cipher.setAAD(Buffer.from(associatedData));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return [SEALED_FORMAT_VERSION, iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === 'string' ? part : part.toString(SEALED_ENCODING)))
    .join(SEALED_PART_SEPARATOR);
}

/** Reverses `sealAesGcm`. Throws `DecryptionError` on any mismatch, never returning garbage. */
export function openAesGcm(key: Buffer, sealed: string, associatedData: string): Buffer {
  assertKey(key);
  const [iv, authTag, ciphertext] = parseSealed(sealed);
  try {
    const decipher = createDecipheriv(CIPHER_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    decipher.setAAD(Buffer.from(associatedData));
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new DecryptionError();
  }
}

function parseSealed(sealed: string): [Buffer, Buffer, Buffer] {
  const parts = sealed.split(SEALED_PART_SEPARATOR);
  if (parts.length !== SEALED_PART_COUNT || parts[0] !== SEALED_FORMAT_VERSION) {
    throw new DecryptionError('Unknown sealed value format');
  }
  const [iv, authTag, ciphertext] = parts
    .slice(1)
    .map((part) => Buffer.from(part, SEALED_ENCODING));
  if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
    throw new DecryptionError('Malformed sealed value');
  }
  return [iv, authTag, ciphertext];
}
