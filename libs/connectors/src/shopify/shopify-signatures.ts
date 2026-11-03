import { Injectable } from '@nestjs/common';
import { constantTimeEquals, hmacSha256 } from '@crossmart/common';
import { ShopifyOAuthParam } from './shopify.constants.js';
import { ShopifyApp } from './shopify-app.js';

const QUERY_PAIR_SEPARATOR = '&';
const QUERY_VALUE_SEPARATOR = '=';

/**
 * Verifies what Shopify signs with the app's client secret: OAuth callbacks (hex HMAC of the
 * sorted query) and webhooks (base64 HMAC of the raw body). Comparisons are constant time.
 */
@Injectable()
export class ShopifySignatures {
  constructor(private readonly app: ShopifyApp) {}

  verifyQuery(query: Readonly<Record<string, string>>): boolean {
    const signature = query[ShopifyOAuthParam.Hmac];
    if (!signature || !this.app.isConfigured) {
      return false;
    }
    const message = Object.entries(query)
      .filter(([key]) => key !== ShopifyOAuthParam.Hmac)
      .sort(([left], [right]) => (left < right ? -1 : 1))
      .map(([key, value]) => `${key}${QUERY_VALUE_SEPARATOR}${value}`)
      .join(QUERY_PAIR_SEPARATOR);
    return constantTimeEquals(
      signature,
      hmacSha256(this.app.credentials().clientSecret, message, 'hex'),
    );
  }

  verifyBody(rawBody: Buffer, signature: string | undefined): boolean {
    if (!signature || !this.app.isConfigured) {
      return false;
    }
    const expected = hmacSha256(this.app.credentials().clientSecret, rawBody, 'base64');
    return constantTimeEquals(signature, expected);
  }
}
