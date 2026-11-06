import type { OAuthTokenResponse } from '../../sdk/oauth/oauth-token-response.js';
import { MILLISECONDS_PER_SECOND } from '../../sdk/time/time.constants.js';

/** An application token and when it expires; never stored, only kept in memory. */
export interface EbayApplicationToken {
  accessToken: string;
  expiresAt: Date;
}

export function toEbayApplicationToken(
  response: OAuthTokenResponse,
  now: Date,
): EbayApplicationToken {
  return {
    accessToken: response.access_token,
    expiresAt: new Date(now.getTime() + response.expires_in * MILLISECONDS_PER_SECOND),
  };
}
