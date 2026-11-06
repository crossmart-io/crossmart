import { type DeliveryRef, WebhookJobQueue } from '@crossmart/core';

/** Keeps webhook jobs instead of sending them to Redis; tests run them with the runner. */
export class RecordingWebhookJobQueue extends WebhookJobQueue {
  private readonly pending: DeliveryRef[] = [];
  dispatchRequests = 0;

  deliverAll(refs: readonly DeliveryRef[]): Promise<void> {
    this.pending.push(...refs);
    return Promise.resolve();
  }

  dispatchSoon(): Promise<void> {
    this.dispatchRequests += 1;
    return Promise.resolve();
  }

  drain(): DeliveryRef[] {
    return this.pending.splice(0);
  }
}
