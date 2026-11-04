import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import { OrderJobName, type OrderRef, OrderSyncService } from '@crossmart/core';

export type OrderQueueJob = Job<OrderRef | Record<string, never>, void, string>;

function isFetch(job: OrderQueueJob): job is Job<OrderRef, void, string> {
  return job.name === OrderJobName.FetchOne;
}

/** Reads orders on the `orders` queue: one a webhook named, or every store's changes. */
@Processor(QueueName.Orders)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(private readonly orders: OrderSyncService) {
    super();
  }

  async process(job: OrderQueueJob): Promise<void> {
    if (isFetch(job)) {
      await this.orders.fetchOne(job.data);
      return;
    }
    const read = await this.orders.pollAll();
    if (read > 0) this.logger.log(`Polling read ${read} changed orders`);
  }
}
