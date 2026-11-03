import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobQueue } from './sync-job.queue.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import {
  SYNC_DEBOUNCE_MS,
  SYNC_JOB_ATTEMPTS,
  SYNC_JOB_BACKOFF_MS,
  SYNC_JOB_KEY_SEPARATOR,
  SYNC_JOBS_KEPT_COMPLETED,
  SYNC_JOBS_KEPT_FAILED,
} from '../listings.constants.js';

const EXPONENTIAL_BACKOFF = 'exponential';

/** The queues listing syncs run on. */
export type SyncQueueName = QueueName.Inventory | QueueName.Price | QueueName.Content;

/** The priority queue of each job kind: inventory > price > content (ADR 0007). */
export const SYNC_JOB_QUEUES: Record<ListingSyncJob['kind'], SyncQueueName> = {
  [SyncJobKind.Inventory]: QueueName.Inventory,
  [SyncJobKind.Price]: QueueName.Price,
  [SyncJobKind.Content]: QueueName.Content,
  [SyncJobKind.Delist]: QueueName.Content,
};

/** Jobs for the same listing and kind share this key, so a burst of changes runs once. */
export function syncJobKey(job: ListingSyncJob): string {
  return [job.kind, job.connectionId, job.productId].join(SYNC_JOB_KEY_SEPARATOR);
}

/**
 * Debounced: a job waits `SYNC_DEBOUNCE_MS` for its kind, and a newer job for the same
 * listing replaces it and restarts the wait. Jobs are idempotent (they send current state),
 * so coalescing never loses a change.
 */
export function syncJobOptions(job: ListingSyncJob): JobsOptions {
  const delay = SYNC_DEBOUNCE_MS[job.kind];
  return {
    delay,
    deduplication: { id: syncJobKey(job), ttl: delay, extend: true, replace: true },
    attempts: SYNC_JOB_ATTEMPTS,
    backoff: { type: EXPONENTIAL_BACKOFF, delay: SYNC_JOB_BACKOFF_MS },
    removeOnComplete: SYNC_JOBS_KEPT_COMPLETED,
    removeOnFail: SYNC_JOBS_KEPT_FAILED,
  };
}

/** Puts sync jobs on their BullMQ priority queues; `apps/worker` processes them. */
@Injectable()
export class BullSyncJobQueue extends SyncJobQueue {
  private readonly queues: Record<SyncQueueName, Queue>;

  constructor(
    @InjectQueue(QueueName.Inventory) inventory: Queue,
    @InjectQueue(QueueName.Price) price: Queue,
    @InjectQueue(QueueName.Content) content: Queue,
  ) {
    super();
    this.queues = {
      [QueueName.Inventory]: inventory,
      [QueueName.Price]: price,
      [QueueName.Content]: content,
    };
  }

  async enqueue(jobs: readonly ListingSyncJob[]): Promise<void> {
    for (const [queueName, queued] of this.groupByQueue(jobs)) {
      await this.queues[queueName].addBulk(
        queued.map((job) => ({ name: job.kind, data: job, opts: syncJobOptions(job) })),
      );
    }
  }

  private groupByQueue(jobs: readonly ListingSyncJob[]): Map<SyncQueueName, ListingSyncJob[]> {
    const groups = new Map<SyncQueueName, ListingSyncJob[]>();
    for (const job of jobs) {
      const queueName = SYNC_JOB_QUEUES[job.kind];
      groups.set(queueName, [...(groups.get(queueName) ?? []), job]);
    }
    return groups;
  }
}
