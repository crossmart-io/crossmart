/**
 * An authenticated handle on one connection, passed to every capability call. The access
 * token is fetched per call, so the session can refresh an expiring token transparently.
 */
export interface ChannelSession {
  readonly connectionId: string;
  readonly externalAccountId: string;
  /** What the merchant granted, so optional features can be skipped without a failed call. */
  readonly grantedScopes: readonly string[];
  accessToken(): Promise<string>;
}
