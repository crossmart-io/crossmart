import { createPublicKey, type KeyObject } from 'node:crypto';
import { z } from 'zod';
import { PEM_PUBLIC_KEY_ARMOR, WHITESPACE_PATTERN } from '../ebay.constants.js';
import { EbaySignatureAlgorithm, EbaySignatureDigest } from './ebay-notification.enums.js';

const BASE64 = 'base64';
const DER_FORMAT = 'der';
const SPKI_TYPE = 'spki';

/** The node:crypto digest name of each digest eBay can name. */
const NODE_DIGESTS: Readonly<Record<EbaySignatureDigest, string>> = {
  [EbaySignatureDigest.Sha1]: 'sha1',
  [EbaySignatureDigest.Sha256]: 'sha256',
};

/** `getPublicKey`'s answer: a PEM key on one line, its algorithm and digest. */
export const ebayPublicKeyResponseSchema = z.object({
  key: z.string().min(1),
  algorithm: z.string().min(1),
  digest: z.string().min(1),
});

export type EbayPublicKeyResponse = z.infer<typeof ebayPublicKeyResponseSchema>;

/** A public key ready to verify signatures with, and the digest eBay signed with. */
export interface EbayPublicKey {
  key: KeyObject;
  /** A node:crypto digest name, such as `sha1`. */
  digest: string;
}

/**
 * The key as node:crypto reads it, or null when eBay names an algorithm or digest Crossmart
 * does not verify, so an unexpected key never verifies by accident.
 */
export function toEbayPublicKey(response: EbayPublicKeyResponse): EbayPublicKey | null {
  const digest = nodeDigest(response.digest);
  const key = readSpkiKey(response.key);
  if (response.algorithm.toUpperCase() !== EbaySignatureAlgorithm.Ecdsa || !digest || !key) {
    return null;
  }
  return { key, digest };
}

function nodeDigest(digest: string): string | null {
  const normalized = digest.toUpperCase();
  return isEbayDigest(normalized) ? NODE_DIGESTS[normalized] : null;
}

function isEbayDigest(value: string): value is EbaySignatureDigest {
  return Object.values<string>(EbaySignatureDigest).includes(value);
}

/** eBay sends the PEM without line breaks, which node:crypto refuses; the DER inside is read. */
function readSpkiKey(pem: string): KeyObject | null {
  const body = pem.replace(PEM_PUBLIC_KEY_ARMOR, '').replace(WHITESPACE_PATTERN, '');
  try {
    return createPublicKey({ key: Buffer.from(body, BASE64), format: DER_FORMAT, type: SPKI_TYPE });
  } catch {
    return null;
  }
}
