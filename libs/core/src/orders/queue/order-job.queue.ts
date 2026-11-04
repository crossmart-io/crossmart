import type { OrderRef } from '../entities/order-ingestion.js';

/** Hands order reads to the worker. Tests replace it to read orders inline. */
export abstract class OrderJobQueue {
  abstract enqueueFetch(ref: OrderRef): Promise<void>;
}
