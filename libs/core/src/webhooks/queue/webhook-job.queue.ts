import type { DeliveryRef } from '../entities/delivery-ref.js';

/** Hands webhook work to the worker. Tests replace it to run deliveries inline. */
export abstract class WebhookJobQueue {
  /** Queues one `deliver` job per claimed delivery. */
  abstract deliverAll(refs: readonly DeliveryRef[]): Promise<void>;

  /** Asks for a dispatch now rather than at the next scheduled one, such as for a test event. */
  abstract dispatchSoon(): Promise<void>;
}
