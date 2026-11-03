import { z } from 'zod';

/**
 * The secrets a connection holds. Stored sealed (envelope encryption), never logged and never
 * returned by the API. Dates are ISO strings so the value round-trips through JSON.
 */
export const channelCredentialsSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  accessTokenExpiresAt: z.iso.datetime().optional(),
  refreshTokenExpiresAt: z.iso.datetime().optional(),
});

export type ChannelCredentials = z.infer<typeof channelCredentialsSchema>;

/** Validates decrypted credentials, which must never be trusted blindly. */
export function parseChannelCredentials(serialized: string): ChannelCredentials {
  return channelCredentialsSchema.parse(JSON.parse(serialized));
}

/** True when the access token expires within `marginMs` of `now` and can be refreshed. */
export function credentialsNeedRefresh(
  credentials: ChannelCredentials,
  now: Date,
  marginMs: number,
): boolean {
  if (!credentials.accessTokenExpiresAt || !credentials.refreshToken) {
    return false;
  }
  return new Date(credentials.accessTokenExpiresAt).getTime() - now.getTime() <= marginMs;
}
