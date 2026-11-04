import { z } from 'zod';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { expiresAt } from '../../sdk/time/expires-at.js';
import { parseScopes } from '../shopify-scopes.js';

/** Shopify's access token response. Expiring offline tokens carry a refresh token. */
export const shopifyTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  scope: z.string(),
  expires_in: z.number().int().positive().optional(),
  refresh_token: z.string().min(1).optional(),
  refresh_token_expires_in: z.number().int().positive().optional(),
});

export type ShopifyTokenResponse = z.infer<typeof shopifyTokenResponseSchema>;

export interface ShopifyGrant {
  credentials: ChannelCredentials;
  grantedScopes: string[];
}

export function toShopifyGrant(response: ShopifyTokenResponse, now: Date): ShopifyGrant {
  return {
    credentials: {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      accessTokenExpiresAt: expiresAt(now, response.expires_in),
      refreshTokenExpiresAt: expiresAt(now, response.refresh_token_expires_in),
    },
    grantedScopes: parseScopes(response.scope),
  };
}
