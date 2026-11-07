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
  /** The browser came back from the channel without a Crossmart session: sign in and retry. */
  SessionRequired = 'session_required',
  ChannelUnavailable = 'channel_unavailable',
  /** The organization's plan has no room for another connected channel. */
  PlanLimitReached = 'plan_limit_reached',
  /** The workspace is an unclaimed sandbox account, which connects no channel until claimed. */
  SandboxClaimRequired = 'sandbox_claim_required',
  Unexpected = 'unexpected',
}
