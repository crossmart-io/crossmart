import type { ChannelCredentials } from '@crossmart/connectors';

/** The access token's expiry, stored in the clear so refreshes can be scheduled. */
export function credentialsExpiry(credentials: ChannelCredentials): Date | null {
  return credentials.accessTokenExpiresAt ? new Date(credentials.accessTokenExpiresAt) : null;
}
