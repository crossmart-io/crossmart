import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { QueueName } from '@crossmart/common';
import { ListingJobHandler, type SyncQueueJob } from './listing-job.handler.js';
import { SYNC_QUEUE_CONCURRENCY } from './sync.constants.js';

const FAILED_EVENT = 'failed';

/** Shared by the three sync queues; each subclass only names its queue and concurrency. */
@Injectable()
abstract class SyncQueueProcessor extends WorkerHost {
  constructor(private readonly handler: ListingJobHandler) {
    super();
  }

  process(job: SyncQueueJob, token?: string): Promise<void> {
    return this.handler.handle(job, token);
  }

  @OnWorkerEvent(FAILED_EVENT)
  onFailed(job: SyncQueueJob | undefined, error: Error): Promise<void> {
    return this.handler.failed(job, error);
  }
}

/** Stock: the highest priority (ADR 0007). Also runs the reconciliation tick. */
@Processor(QueueName.Inventory, { concurrency: SYNC_QUEUE_CONCURRENCY[QueueName.Inventory] })
export class InventorySyncProcessor extends SyncQueueProcessor {}

@Processor(QueueName.Price, { concurrency: SYNC_QUEUE_CONCURRENCY[QueueName.Price] })
export class PriceSyncProcessor extends SyncQueueProcessor {}

/** Publishing, updates and delisting. */
@Processor(QueueName.Content, { concurrency: SYNC_QUEUE_CONCURRENCY[QueueName.Content] })
export class ContentSyncProcessor extends SyncQueueProcessor {}
