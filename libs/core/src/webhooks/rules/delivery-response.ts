import type { DeliveryAttemptResult } from '../entities/delivery-attempt.js';
import { WebhookDeliveryFailure } from '../enums/webhook-delivery-failure.enum.js';

const HTTP_SUCCESS_MIN = 200;
const HTTP_SUCCESS_MAX = 299;
const HTTP_REDIRECT_MIN = 300;
const HTTP_REDIRECT_MAX = 399;

/** What an answer with this status means for the attempt: only 2xx is a success. */
export function resultOfStatus(status: number, durationMs: number): DeliveryAttemptResult {
  if (status >= HTTP_SUCCESS_MIN && status <= HTTP_SUCCESS_MAX) {
    return { succeeded: true, responseStatus: status, durationMs, error: null };
  }
  const error =
    status >= HTTP_REDIRECT_MIN && status <= HTTP_REDIRECT_MAX
      ? WebhookDeliveryFailure.Redirect
      : `${WebhookDeliveryFailure.ErrorStatus} ${status}`;
  return { succeeded: false, responseStatus: status, durationMs, error };
}

/** An attempt that got no answer at all. */
export function resultOfFailure(
  failure: WebhookDeliveryFailure,
  durationMs: number,
): DeliveryAttemptResult {
  return { succeeded: false, responseStatus: null, durationMs, error: failure };
}
