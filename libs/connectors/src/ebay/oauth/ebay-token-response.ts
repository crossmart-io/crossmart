import { z } from 'zod';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { expiresAt } from '../../sdk/time/expires-at.js';

/**
 * eBay's user token response. The code grant returns a 2 hour access token and an 18 month
 * refresh token; a refresh returns only a new access token.
 */
export const ebayTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  token_type: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  refresh_token_expires_in: z.number().int().positive().optional(),
});

export type EbayTokenResponse = z.infer<typeof ebayTokenResponseSchema>;

/** eBay's OAuth error body, such as `{ "error": "invalid_grant" }`. */
export const ebayTokenErrorSchema = z.object({ error: z.string() });

export function toEbayCredentials(response: EbayTokenResponse, now: Date): ChannelCredentials {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    accessTokenExpiresAt: expiresAt(now, response.expires_in),
    refreshTokenExpiresAt: expiresAt(now, response.refresh_token_expires_in),
  };
}
