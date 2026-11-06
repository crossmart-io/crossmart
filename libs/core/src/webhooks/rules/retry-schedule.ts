import {
  WEBHOOK_MAX_ATTEMPTS,
  WEBHOOK_RETRY_BACKOFF_FACTOR,
  WEBHOOK_RETRY_BASE_DELAY_MS,
  WEBHOOK_RETRY_JITTER_RATIO,
  WEBHOOK_RETRY_MAX_DELAY_MS,
  WEBHOOK_TEST_MAX_ATTEMPTS,
} from '../webhooks.constants.js';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';

/** A number in [0, 1), such as `Math.random`; injected so tests are exact. */
export type RandomSource = () => number;

/** How many attempts a delivery of this event gets, the first included. */
export function maxAttemptsFor(eventType: string): number {
  return eventType === WebhookEventType.Test ? WEBHOOK_TEST_MAX_ATTEMPTS : WEBHOOK_MAX_ATTEMPTS;
}

/**
 * The wait after `attempts` failed attempts: exponential from the base delay, capped, plus up
 * to 10% at random so many failing deliveries do not all retry at the same moment.
 */
export function retryDelayMs(attempts: number, random: RandomSource = Math.random): number {
  const exponent = Math.max(attempts - 1, 0);
  const delay = Math.min(
    WEBHOOK_RETRY_BASE_DELAY_MS * WEBHOOK_RETRY_BACKOFF_FACTOR ** exponent,
    WEBHOOK_RETRY_MAX_DELAY_MS,
  );
  return Math.round(delay * (1 + random() * WEBHOOK_RETRY_JITTER_RATIO));
}
