/**
 * An authenticated handle on one connection, passed to every capability call. The access
 * token is fetched per call, so the session can refresh an expiring token transparently.
 */
export interface ChannelSession {
  readonly connectionId: string;
  readonly externalAccountId: string;
  accessToken(): Promise<string>;
}
