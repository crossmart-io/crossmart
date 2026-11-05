import type { ChannelSettings } from '../channel-settings.js';

/**
 * An authenticated handle on one connection, passed to every capability call. The access
 * token is fetched per call, so the session can refresh an expiring token transparently.
 */
export interface ChannelSession {
  readonly connectionId: string;
  readonly externalAccountId: string;
  /** What the merchant granted, so optional features can be skipped without a failed call. */
  readonly grantedScopes: readonly string[];
  /**
   * The account settings stored for the connection, as its connector validated them; null
   * before the account was read. Channels that address listings through settings (Google's
   * data source) read them here.
   */
  readonly settings?: ChannelSettings | null;
  accessToken(): Promise<string>;
}
