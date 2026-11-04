import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import type { OrderRef } from '../entities/order-ingestion.js';
import {
  ORDER_JOB_ATTEMPTS,
  ORDER_JOB_BACKOFF_MS,
  ORDER_JOBS_KEPT_COMPLETED,
  ORDER_JOBS_KEPT_FAILED,
  OrderJobName,
} from '../orders.constants.js';
import { OrderJobQueue } from './order-job.queue.js';

const EXPONENTIAL_BACKOFF = 'exponential';
const KEY_SEPARATOR = ':';

/**
 * Queues order reads on the `orders` queue, right after inventory in priority. A burst of
 * webhooks for one order (created, paid, updated) is read once while the first waits.
 */
@Injectable()
export class BullOrderJobQueue extends OrderJobQueue {
  constructor(@InjectQueue(QueueName.Orders) private readonly queue: Queue<OrderRef>) {
    super();
  }

  async enqueueFetch(ref: OrderRef): Promise<void> {
    await this.queue.add(OrderJobName.FetchOne, ref, {
      deduplication: {
        id: [OrderJobName.FetchOne, ref.connectionId, ref.externalOrderId].join(KEY_SEPARATOR),
      },
      attempts: ORDER_JOB_ATTEMPTS,
      backoff: { type: EXPONENTIAL_BACKOFF, delay: ORDER_JOB_BACKOFF_MS },
      removeOnComplete: ORDER_JOBS_KEPT_COMPLETED,
      removeOnFail: ORDER_JOBS_KEPT_FAILED,
    });
  }
}
