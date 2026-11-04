/** Why a channel call failed, in terms callers can act on. */
export enum ChannelErrorCode {
  /** The account identifier (a shop domain) is not valid for the channel. */
  InvalidAccount = 'invalid_account',
  /** A callback or webhook signature did not verify. */
  InvalidSignature = 'invalid_signature',
  /** The merchant declined the authorization. */
  AccessDenied = 'access_denied',
  /** The channel did not grant every scope Crossmart needs. */
  MissingScopes = 'missing_scopes',
  /** The channel no longer accepts the credentials: the merchant must connect again. */
  CredentialsRejected = 'credentials_rejected',
  /** The channel rate limited the call and retries ran out. */
  RateLimited = 'rate_limited',
  /** The channel answered with an error or a response Crossmart does not understand. */
  ChannelUnavailable = 'channel_unavailable',
  /** The channel rejected the request itself (a GraphQL or validation error). */
  RequestRejected = 'request_rejected',
}
