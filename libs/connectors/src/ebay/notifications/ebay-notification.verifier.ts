import { verify } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { EbayPublicKeyClient } from './ebay-public-key.client.js';
import type { EbayPublicKey } from './ebay-public-key.js';
import { parseEbaySignatureHeader } from './ebay-signature-header.js';

const BASE64 = 'base64';
const UTF8 = 'utf8';

/**
 * Verifies eBay push notifications: the `X-EBAY-SIGNATURE` header names a key id and carries
 * an ECDSA signature (DER, base64) of the message, checked with the key eBay publishes for that
 * id. There is no bypass: without a valid signature from eBay's key, nothing verifies.
 */
@Injectable()
export class EbayNotificationVerifier {
  constructor(private readonly keys: EbayPublicKeyClient) {}

  /**
   * True when eBay signed `rawBody`. Rejects only when the key could not be read from eBay
   * (an outage), so the caller can answer with an error and eBay delivers again.
   */
  async verify(rawBody: Buffer, signatureHeader: string | undefined): Promise<boolean> {
    const header = parseEbaySignatureHeader(signatureHeader);
    if (!header) return false;
    const publicKey = await this.keys.find(header.kid);
    if (!publicKey) return false;
    const signature = Buffer.from(header.signature, BASE64);
    return this.signedMessages(rawBody).some((message) =>
      this.isSignedBy(publicKey, message, signature),
    );
  }

  /**
   * The body as received, then as eBay's own SDKs verify it: parsed and serialized again
   * (`JSON.stringify`). Both are the bytes eBay signed when the body arrives compact.
   */
  private signedMessages(rawBody: Buffer): Buffer[] {
    const parsed = parseJsonBody(rawBody.toString(UTF8));
    if (parsed === null) return [rawBody];
    const serialized = Buffer.from(JSON.stringify(parsed), UTF8);
    return serialized.equals(rawBody) ? [rawBody] : [rawBody, serialized];
  }

  private isSignedBy(publicKey: EbayPublicKey, message: Buffer, signature: Buffer): boolean {
    try {
      return verify(publicKey.digest, message, publicKey.key, signature);
    } catch {
      return false;
    }
  }
}
