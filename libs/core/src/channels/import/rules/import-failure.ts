import { HttpException, HttpStatus } from '@nestjs/common';
import { ChannelError } from '@crossmart/connectors';
import { toFailureReason } from '../../../activity/rules/failure-reason.js';

/**
 * A failure that retrying cannot fix: the channel refused the request or the credentials, or
 * the connection is gone. Outages, rate limits and unexpected errors are retried.
 */
export function isPermanentImportFailure(error: unknown): boolean {
  if (error instanceof ChannelError) {
    return !error.retryable;
  }
  return error instanceof HttpException && error.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * A reason that is safe to store and show. Channel errors are written for merchants and never
 * hold credentials, so their message is kept; anything else falls back to the generic rule.
 */
export function toImportFailureReason(error: unknown): string {
  return error instanceof ChannelError ? error.message : toFailureReason(error);
}
