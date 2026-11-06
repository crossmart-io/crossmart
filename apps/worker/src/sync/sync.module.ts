import { Module } from '@nestjs/common';
import { ListingsModule } from '@crossmart/core';
import { ConnectionRateLimiter } from './connection-rate-limiter.js';
import { ListingJobHandler } from './listing-job.handler.js';
import { ReconciliationScheduler } from './reconciliation.scheduler.js';
import { SyncRequestSweepScheduler } from './sync-request-sweep.scheduler.js';
import {
  ContentSyncProcessor,
  InventorySyncProcessor,
  PriceSyncProcessor,
} from './sync.processors.js';

/** Channel sync: the inventory, price and content queues, paced per connection. */
@Module({
  imports: [ListingsModule],
  providers: [
    ConnectionRateLimiter,
    ListingJobHandler,
    InventorySyncProcessor,
    PriceSyncProcessor,
    ContentSyncProcessor,
    ReconciliationScheduler,
    SyncRequestSweepScheduler,
  ],
})
export class SyncModule {}
