import type { ChannelType } from '../channel-type.enum.js';
import type { PublishRequirement } from '../publishing/publish-requirement.enum.js';
import type { UnmetPublishRequirement } from '../publishing/unmet-publish-requirement.js';
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
    /** Set when the channel refused because publishing lacks this; the merchant can add it. */
    readonly requirement: PublishRequirement | null = null,
  ) {
    super(message);
    this.name = 'ChannelError';
  }

  /** A publish refused before reaching the channel, because it lacks what `unmet` names. */
  static unmet(channel: ChannelType, unmet: UnmetPublishRequirement): ChannelError {
    return new ChannelError(
      channel,
      ChannelErrorCode.RequestRejected,
      unmet.reason,
      unmet.requirement,
    );
  }

  /** Worth retrying later, such as rate limits and outages. */
  get retryable(): boolean {
    return RETRYABLE_CODES.has(this.code);
  }
}
