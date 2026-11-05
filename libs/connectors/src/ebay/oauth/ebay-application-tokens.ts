import { Injectable } from '@nestjs/common';
import { EBAY_APPLICATION_TOKEN_REFRESH_MARGIN_MS } from '../ebay.constants.js';
import { EbayOAuthClient } from './ebay-oauth.client.js';
import type { EbayApplicationToken } from './ebay-token-response.js';

/**
 * The app's own access token, kept in memory and requested again shortly before it expires, so
 * reading public keys does not cost a token request each time. Concurrent callers share one
 * request.
 */
@Injectable()
export class EbayApplicationTokens {
  private current: Promise<EbayApplicationToken> | null = null;

  constructor(private readonly oauth: EbayOAuthClient) {}

  async accessToken(now = new Date()): Promise<string> {
    if (!this.current || this.isExpiring(await this.current, now)) {
      this.current = this.request(now);
    }
    return (await this.current).accessToken;
  }

  /** A failed request is forgotten, so the next caller tries again. */
  private request(now: Date): Promise<EbayApplicationToken> {
    return this.oauth.requestApplicationToken(now).catch((error: unknown) => {
      this.current = null;
      throw error;
    });
  }

  private isExpiring(token: EbayApplicationToken, now: Date): boolean {
    return token.expiresAt.getTime() - EBAY_APPLICATION_TOKEN_REFRESH_MARGIN_MS <= now.getTime();
  }
}
