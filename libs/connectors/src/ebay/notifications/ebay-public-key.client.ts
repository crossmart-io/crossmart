import { Injectable } from '@nestjs/common';
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } from '../../sdk/http/http.constants.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import {
  EBAY_PUBLIC_KEY_CACHE_MAX_ENTRIES,
  EBAY_PUBLIC_KEY_CACHE_TTL_MS,
  EBAY_PUBLIC_KEY_PATH,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import { EbayApplicationTokens } from '../oauth/ebay-application-tokens.js';
import {
  type EbayPublicKey,
  ebayPublicKeyResponseSchema,
  toEbayPublicKey,
} from './ebay-public-key.js';

/** What eBay answers for a key id it never issued. */
const UNKNOWN_KEY_STATUSES: ReadonlySet<number> = new Set([
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
]);

interface CachedKey {
  key: EbayPublicKey;
  expiresAt: number;
}

/**
 * Reads the public keys eBay signs notifications with (Notification API `getPublicKey`), with
 * the app's own token, and keeps each for an hour as eBay asks. Unknown key ids are not cached.
 */
@Injectable()
export class EbayPublicKeyClient {
  private readonly cache = new Map<string, CachedKey>();

  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
    private readonly tokens: EbayApplicationTokens,
  ) {}

  /** The key, or null when eBay does not know the id or names a key Crossmart cannot use. */
  async find(keyId: string, now = new Date()): Promise<EbayPublicKey | null> {
    const cached = this.cache.get(keyId);
    if (cached && cached.expiresAt > now.getTime()) {
      return cached.key;
    }
    const key = await this.fetch(keyId, now);
    if (key) this.remember(keyId, key, now);
    return key;
  }

  private async fetch(keyId: string, now: Date): Promise<EbayPublicKey | null> {
    const url = new URL(
      `${EBAY_PUBLIC_KEY_PATH}${encodeURIComponent(keyId)}`,
      this.app.hosts().api,
    );
    const response: HttpResponse = await this.api.send(url, await this.tokens.accessToken(now));
    if (UNKNOWN_KEY_STATUSES.has(response.status)) {
      return null;
    }
    return toEbayPublicKey(this.api.parse(response, ebayPublicKeyResponseSchema));
  }

  /** The oldest entry makes room once the cache is full. */
  private remember(keyId: string, key: EbayPublicKey, now: Date): void {
    this.cache.delete(keyId);
    if (this.cache.size >= EBAY_PUBLIC_KEY_CACHE_MAX_ENTRIES) {
      const [oldest] = this.cache.keys();
      this.cache.delete(oldest);
    }
    this.cache.set(keyId, { key, expiresAt: now.getTime() + EBAY_PUBLIC_KEY_CACHE_TTL_MS });
  }
}
