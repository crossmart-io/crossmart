/**
 * Why connecting a channel failed. Sent to the web app as `?error=<value>` after the OAuth
 * callback, so it names a cause and never carries details.
 */
export enum ConnectFailure {
  InvalidState = 'invalid_state',
  ExpiredState = 'expired_state',
  InvalidSignature = 'invalid_signature',
  InvalidAccount = 'invalid_account',
  AccessDenied = 'access_denied',
  MissingScopes = 'missing_scopes',
  NotPermitted = 'not_permitted',
  ChannelUnavailable = 'channel_unavailable',
  Unexpected = 'unexpected',
}
