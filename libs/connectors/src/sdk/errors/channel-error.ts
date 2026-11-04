import type { ChannelType } from '../channel-type.enum.js';
import { ChannelErrorCode } from './channel-error-code.enum.js';

const RETRYABLE_CODES: ReadonlySet<ChannelErrorCode> = new Set([
  ChannelErrorCode.RateLimited,
  ChannelErrorCode.ChannelUnavailable,
]);

/**
 * A failed channel call. Messages are written for merchants and never contain credentials,
 * tokens or raw response bodies, so they are safe to log and to show.
 */
export class ChannelError extends Error {
  constructor(
    readonly channel: ChannelType,
    readonly code: ChannelErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ChannelError';
  }

  /** Worth retrying later, such as rate limits and outages. */
  get retryable(): boolean {
    return RETRYABLE_CODES.has(this.code);
  }
}
