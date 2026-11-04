import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  OrderJobName,
  type OrderRef,
  OrderRetentionService,
  OrderSyncService,
} from '@crossmart/core';

export type OrderQueueJob = Job<OrderRef | Record<string, never>, void, string>;

function isFetch(job: OrderQueueJob): job is Job<OrderRef, void, string> {
  return job.name === OrderJobName.FetchOne;
}

/** Runs the `orders` queue: one order a webhook named, every store's changes, or the daily purge. */
@Processor(QueueName.Orders)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly orders: OrderSyncService,
    private readonly retention: OrderRetentionService,
  ) {
    super();
  }

  async process(job: OrderQueueJob): Promise<void> {
    if (isFetch(job)) {
      await this.orders.fetchOne(job.data);
      return;
    }
    if (job.name === OrderJobName.PurgeOld) {
      await this.retention.purge();
      return;
    }
    const read = await this.orders.pollAll();
    if (read > 0) this.logger.log(`Polling read ${read} changed orders`);
  }
}
