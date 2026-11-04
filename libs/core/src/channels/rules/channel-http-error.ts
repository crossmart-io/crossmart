import {
  BadGatewayException,
  ConflictException,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ChannelError, ChannelErrorCode } from '@crossmart/connectors';

/**
 * What a channel failure during an API request means to the caller: a request the channel
 * rejected (422, with its merchant-readable reason), a connection to reconnect (409), a rate
 * limit (429), or an outage (502). Channel messages never hold credentials.
 */
export function toHttpException(error: ChannelError): HttpException {
  switch (error.code) {
    case ChannelErrorCode.RequestRejected:
    case ChannelErrorCode.InvalidAccount:
      return new UnprocessableEntityException(error.message);
    case ChannelErrorCode.CredentialsRejected:
    case ChannelErrorCode.AccessDenied:
    case ChannelErrorCode.MissingScopes:
      return new ConflictException(error.message);
    case ChannelErrorCode.RateLimited:
      return new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
    case ChannelErrorCode.ChannelUnavailable:
    case ChannelErrorCode.InvalidSignature:
      return new BadGatewayException(error.message);
  }
}

/** Runs a channel call for an API request, turning its `ChannelError` into an HTTP error. */
export async function callChannel<TResult>(call: () => Promise<TResult>): Promise<TResult> {
  try {
    return await call();
  } catch (error) {
    throw error instanceof ChannelError ? toHttpException(error) : error;
  }
}
