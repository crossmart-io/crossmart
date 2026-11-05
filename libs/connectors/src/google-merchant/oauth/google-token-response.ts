import { z } from 'zod';
import type { ChannelCredentials } from '../../sdk/auth/channel-credentials.js';
import { expiresAt } from '../../sdk/time/expires-at.js';
import { GOOGLE_SCOPE_SEPARATOR } from '../google-merchant.constants.js';

/**
 * Google's token response. The code grant returns a one hour access token and, for offline
 * access, a refresh token; a refresh returns only a new access token. Apps in Testing mode
 * also learn when the refresh token expires (`refresh_token_expires_in`).
 */
export const googleTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  token_type: z.string().min(1),
  scope: z.string().optional(),
  refresh_token: z.string().min(1).optional(),
  refresh_token_expires_in: z.number().int().positive().optional(),
});

export type GoogleTokenResponse = z.infer<typeof googleTokenResponseSchema>;

/** Google's OAuth error body, such as `{ "error": "invalid_grant" }`. */
export const googleTokenErrorSchema = z.object({ error: z.string() });

export function toGoogleCredentials(response: GoogleTokenResponse, now: Date): ChannelCredentials {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    accessTokenExpiresAt: expiresAt(now, response.expires_in),
    refreshTokenExpiresAt: expiresAt(now, response.refresh_token_expires_in),
  };
}

/** The scopes the merchant granted, as Google lists them. */
export function grantedScopes(response: GoogleTokenResponse): string[] {
  return (response.scope ?? '').split(GOOGLE_SCOPE_SEPARATOR).filter(Boolean);
}
