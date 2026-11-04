import { OrderJobQueue, type OrderRef } from '@crossmart/core';

/** Keeps order reads instead of sending them to Redis; tests run them with the sync service. */
export class RecordingOrderJobQueue extends OrderJobQueue {
  private readonly pending: OrderRef[] = [];

  enqueueFetch(ref: OrderRef): Promise<void> {
    this.pending.push(ref);
    return Promise.resolve();
  }

  drain(): OrderRef[] {
    return this.pending.splice(0);
  }
}
