import { Injectable, Logger } from '@nestjs/common';
import { DelayedError, type Job } from 'bullmq';
import {
  InventoryReconciliationService,
  type ListingSyncJob,
  ListingSyncRunner,
  SYNC_JOB_COST,
  SyncJobKind,
} from '@crossmart/core';
import { ConnectionRateLimiter } from './connection-rate-limiter.js';

/** A job as it sits on a sync queue: a listing job, or the reconciliation tick. */
export type SyncQueueJob = Job<ListingSyncJob | Record<string, never>, void, string>;

function isListingJob(job: SyncQueueJob): job is Job<ListingSyncJob, void, string> {
  return job.name !== SyncJobKind.ReconcileInventory;
}

/**
 * Runs sync jobs for every sync queue: paces them per connection with the connector's
 * rate-limit buckets (a job that must wait goes back to the delayed set, freeing the worker),
 * then hands them to `ListingSyncRunner`.
 */
@Injectable()
export class ListingJobHandler {
  private readonly logger = new Logger(ListingJobHandler.name);

  constructor(
    private readonly runner: ListingSyncRunner,
    private readonly reconciliation: InventoryReconciliationService,
    private readonly limiter: ConnectionRateLimiter,
  ) {}

  async handle(job: SyncQueueJob, token?: string): Promise<void> {
    if (!isListingJob(job)) {
      await this.reconciliation.reconcile();
      return;
    }
    const buckets = await this.runner.rateLimitsOf(job.data);
    const wait = this.limiter.reserve(job.data.connectionId, buckets, SYNC_JOB_COST[job.data.kind]);
    if (wait > 0) {
      await job.moveToDelayed(Date.now() + wait, token);
      throw new DelayedError();
    }
    await this.runner.run(job.data);
  }

  /** Called when a job failed; once its retries are spent, its listing is marked in error. */
  async failed(job: SyncQueueJob | undefined, error: Error): Promise<void> {
    if (!job || !isListingJob(job)) return;
    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < attempts) return;
    this.logger.warn(`Sync job ${job.name} for listing of product ${job.data.productId} gave up`);
    await this.runner.exhausted(job.data, error);
  }
}
