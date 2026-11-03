import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  INVENTORY_RECONCILIATION_INTERVAL_MS,
  INVENTORY_RECONCILIATION_SCHEDULER_ID,
  SyncJobKind,
} from '@crossmart/core';

/** Schedules inventory reconciliation every 15 minutes (ADR 0007); one schedule however many workers. */
@Injectable()
export class ReconciliationScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Inventory) private readonly inventory: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.inventory.upsertJobScheduler(
      INVENTORY_RECONCILIATION_SCHEDULER_ID,
      { every: INVENTORY_RECONCILIATION_INTERVAL_MS },
      { name: SyncJobKind.ReconcileInventory, data: {} },
    );
  }
}
