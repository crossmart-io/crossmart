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

/** A failed OAuth callback. Its message is safe to store in the activity log. */
export class ChannelConnectError extends Error {
  constructor(readonly failure: ConnectFailure) {
    super(FAILURE_MESSAGES[failure]);
    this.name = 'ChannelConnectError';
  }

  static from(error: unknown): ChannelConnectError {
    if (error instanceof ChannelConnectError) {
      return error;
    }
    if (error instanceof EntitlementExceededException) {
      return new ChannelConnectError(ConnectFailure.PlanLimitReached);
    }
    const failure = error instanceof ChannelError ? CHANNEL_ERROR_FAILURES[error.code] : undefined;
    return new ChannelConnectError(failure ?? ConnectFailure.Unexpected);
  }
}
