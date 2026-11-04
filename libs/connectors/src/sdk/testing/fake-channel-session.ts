import type { ChannelSession } from '../auth/channel-session.js';

/** A session with a fixed token, for connector tests. */
export function fakeChannelSession(
  externalAccountId: string,
  token = 'test-access-token',
): ChannelSession {
  return {
    connectionId: 'connection-1',
    externalAccountId,
    accessToken: () => Promise.resolve(token),
  };
}
