import { z } from 'zod';
import type { ChannelCredentials } from '../auth/channel-credentials.js';
import { expiresAt } from '../time/expires-at.js';
import { OAUTH_SCOPE_SEPARATOR } from './oauth.constants.js';

/**
 * A successful token response (RFC 6749 §5.1). `refresh_token_expires_in` is an extension
 * eBay and Google both send, so the refresh token's expiry can be stored.
 */
export const oauthTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  token_type: z.string().min(1),
  scope: z.string().optional(),
  refresh_token: z.string().min(1).optional(),
  refresh_token_expires_in: z.number().int().positive().optional(),
});

export type OAuthTokenResponse = z.infer<typeof oauthTokenResponseSchema>;

/** An error response (RFC 6749 §5.2), such as `{ "error": "invalid_grant" }`. */
export const oauthErrorResponseSchema = z.object({ error: z.string() });

/** What an authorization code exchange yields, the same for every OAuth channel. */
export interface OAuthTokenGrant {
  credentials: ChannelCredentials;
  /**
   * The scopes the response lists, or null when it lists none: RFC 6749 §5.1 then means the
   * requested scopes were granted (eBay never lists them).
   */
  grantedScopes: string[] | null;
}

export function toChannelCredentials(response: OAuthTokenResponse, now: Date): ChannelCredentials {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    accessTokenExpiresAt: expiresAt(now, response.expires_in),
    refreshTokenExpiresAt: expiresAt(now, response.refresh_token_expires_in),
  };
}

/** The scopes a token response lists; null when it has no `scope`. */
export function grantedScopesOf(response: OAuthTokenResponse): string[] | null {
  if (response.scope === undefined) return null;
  return response.scope.split(OAUTH_SCOPE_SEPARATOR).filter(Boolean);
}
