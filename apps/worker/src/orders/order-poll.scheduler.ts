import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  ORDER_POLL_INTERVAL_MS,
  ORDER_POLL_SCHEDULER_ID,
  ORDER_PURGE_INTERVAL_MS,
  ORDER_PURGE_SCHEDULER_ID,
  OrderJobName,
} from '@crossmart/core';

/** Polls every store's orders every 2 minutes (ADR 0007) and purges old orders daily. */
@Injectable()
export class OrderPollScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Orders) private readonly orders: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.orders.upsertJobScheduler(
      ORDER_POLL_SCHEDULER_ID,
      { every: ORDER_POLL_INTERVAL_MS },
      { name: OrderJobName.PollAll, data: {} },
    );
    await this.orders.upsertJobScheduler(
      ORDER_PURGE_SCHEDULER_ID,
      { every: ORDER_PURGE_INTERVAL_MS },
      { name: OrderJobName.PurgeOld, data: {} },
    );
  }
}
