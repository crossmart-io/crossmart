import { ChannelError, ChannelErrorCode } from '@crossmart/connectors';
import { EntitlementExceededException } from '../../entitlements/errors/entitlement-exceeded.exception.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';

const FAILURE_MESSAGES: Record<ConnectFailure, string> = {
  [ConnectFailure.InvalidState]: 'The connection request is not valid. Start again from Crossmart.',
  [ConnectFailure.ExpiredState]: 'The connection request expired. Start again from Crossmart.',
  [ConnectFailure.InvalidSignature]: 'The channel’s reply could not be verified',
  [ConnectFailure.InvalidAccount]: 'The channel replied for a different account',
  [ConnectFailure.AccessDenied]: 'The app was not approved on the channel',
  [ConnectFailure.MissingScopes]: 'The channel did not grant every permission Crossmart needs',
  [ConnectFailure.NotPermitted]: 'You can no longer manage this workspace',
  [ConnectFailure.SessionRequired]:
    'You were not signed in to Crossmart when the channel sent you back. Sign in and start again.',
  [ConnectFailure.ChannelUnavailable]: 'The channel is not responding. Try again in a moment.',
  [ConnectFailure.PlanLimitReached]: 'The plan has no room for another connected channel',
  [ConnectFailure.Unexpected]: 'The channel could not be connected',
};

const CHANNEL_ERROR_FAILURES: Partial<Record<ChannelErrorCode, ConnectFailure>> = {
  [ChannelErrorCode.InvalidSignature]: ConnectFailure.InvalidSignature,
  [ChannelErrorCode.InvalidAccount]: ConnectFailure.InvalidAccount,
  [ChannelErrorCode.AccessDenied]: ConnectFailure.AccessDenied,
  [ChannelErrorCode.MissingScopes]: ConnectFailure.MissingScopes,
  [ChannelErrorCode.ChannelUnavailable]: ConnectFailure.ChannelUnavailable,
  [ChannelErrorCode.RateLimited]: ConnectFailure.ChannelUnavailable,
};

const DETAIL_SEPARATOR = ': ';

/**
 * A failed OAuth callback. Its message is safe to store in the activity log: the failure, and
 * the channel's own explanation when there is one (channel error messages never hold tokens or
 * response bodies).
 */
export class ChannelConnectError extends Error {
  constructor(
    readonly failure: ConnectFailure,
    /** What the channel said, such as Google's reason; null when it said nothing usable. */
    readonly detail: string | null = null,
  ) {
    super(
      detail
        ? `${FAILURE_MESSAGES[failure]}${DETAIL_SEPARATOR}${detail}`
        : FAILURE_MESSAGES[failure],
    );
    this.name = 'ChannelConnectError';
  }

  static from(error: unknown): ChannelConnectError {
    if (error instanceof ChannelConnectError) {
      return error;
    }
    if (error instanceof EntitlementExceededException) {
      return new ChannelConnectError(ConnectFailure.PlanLimitReached);
    }
    if (!(error instanceof ChannelError)) {
      return new ChannelConnectError(ConnectFailure.Unexpected);
    }
    const failure = CHANNEL_ERROR_FAILURES[error.code] ?? ConnectFailure.Unexpected;
    return new ChannelConnectError(failure, `${error.code}${DETAIL_SEPARATOR}${error.message}`);
  }
}
