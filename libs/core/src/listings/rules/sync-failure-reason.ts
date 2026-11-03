import { HttpException } from '@nestjs/common';
import { ChannelError } from '@crossmart/connectors';
import { LISTING_FAILURE_MAX_LENGTH, UNEXPECTED_SYNC_FAILURE } from '../listings.constants.js';

/**
 * A reason safe to store on a listing and show. Channel errors are written for merchants and
 * never hold credentials; anything else may hold internals, so it is replaced.
 */
export function syncFailureReason(error: unknown): string {
  const message =
    error instanceof ChannelError || error instanceof HttpException
      ? error.message
      : UNEXPECTED_SYNC_FAILURE;
  return message.slice(0, LISTING_FAILURE_MAX_LENGTH);
}

/** Outages and rate limits are retried by the queue; anything else will fail again. */
export function isRetryableSyncError(error: unknown): boolean {
  return !(error instanceof ChannelError) || error.retryable;
}
