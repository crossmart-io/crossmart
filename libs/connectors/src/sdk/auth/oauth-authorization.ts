import type { ChannelCredentials } from './channel-credentials.js';

export interface OAuthAuthorizeRequest {
  /** What the merchant typed to name their account, such as a shop domain. */
  accountHandle: string;
  /** Signed by Crossmart; returned unchanged on the callback. */
  state: string;
  redirectUri: string;
}

/** The query string the channel redirected back with, as received. */
export interface OAuthCallback {
  query: Readonly<Record<string, string>>;
  redirectUri: string;
}

/** The outcome of a completed authorization: who the account is and how to call it. */
export interface ChannelAuthorization {
  externalAccountId: string;
  credentials: ChannelCredentials;
  grantedScopes: string[];
}
