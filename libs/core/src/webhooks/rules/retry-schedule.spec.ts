import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import {
  WEBHOOK_MAX_ATTEMPTS,
  WEBHOOK_RETRY_BASE_DELAY_MS,
  WEBHOOK_RETRY_MAX_DELAY_MS,
} from '../webhooks.constants.js';
import { maxAttemptsFor, retryDelayMs } from './retry-schedule.js';

const NO_JITTER = (): number => 0;

describe('webhook retry schedule', () => {
  it('doubles the delay after each failed attempt', () => {
    expect(retryDelayMs(1, NO_JITTER)).toBe(WEBHOOK_RETRY_BASE_DELAY_MS);
    expect(retryDelayMs(2, NO_JITTER)).toBe(WEBHOOK_RETRY_BASE_DELAY_MS * 2);
    expect(retryDelayMs(4, NO_JITTER)).toBe(WEBHOOK_RETRY_BASE_DELAY_MS * 8);
  });

  it('never waits longer than the maximum, plus jitter', () => {
    expect(retryDelayMs(40, NO_JITTER)).toBe(WEBHOOK_RETRY_MAX_DELAY_MS);
    expect(retryDelayMs(40, () => 0.5)).toBe(WEBHOOK_RETRY_MAX_DELAY_MS * 1.05);
  });

  it('tries test events once and the others many times', () => {
    expect(maxAttemptsFor(WebhookEventType.Test)).toBe(1);
    expect(maxAttemptsFor(WebhookEventType.OrderCreated)).toBe(WEBHOOK_MAX_ATTEMPTS);
  });

  it('spreads the attempts over about a day', () => {
    const total = Array.from({ length: WEBHOOK_MAX_ATTEMPTS - 1 }, (_, index) =>
      retryDelayMs(index + 1, NO_JITTER),
    ).reduce((sum, delay) => sum + delay, 0);
    const hours = total / (60 * 60 * 1000);
    expect(hours).toBeGreaterThan(12);
    expect(hours).toBeLessThan(24);
  });
});
