import type { DeliveryAttemptResult, WebhookRequest } from '../entities/delivery-attempt.js';

/** Sends one signed webhook request. Never throws: every failure is an attempt result. */
export abstract class WebhookSender {
  abstract send(request: WebhookRequest): Promise<DeliveryAttemptResult>;
}
