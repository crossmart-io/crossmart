import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { EventsModule } from '../events/events.module.js';
import { ListingOverrideRepository } from './repositories/listing-override.repository.js';
import { ListingSyncRepository } from './repositories/listing-sync.repository.js';
import { ProductSelectionRepository } from './repositories/product-selection.repository.js';
import { BullSyncJobQueue } from './services/bull-sync-job.queue.js';
import { ChannelListingsService } from './services/channel-listings.service.js';
import { ChannelProductsService } from './services/channel-products.service.js';
import { StoreMembershipService } from './services/store-membership.service.js';
import { StoreMembershipWriter } from './services/store-membership.writer.js';
import { SelectionApplier } from './services/selection-applier.js';
import { ChannelProductsRepository } from './repositories/channel-products.repository.js';
import { ChannelPriceResolver } from './services/channel-price-resolver.js';
import { ChannelSyncService } from './services/channel-sync.service.js';
import { ConnectionRulesService } from './services/connection-rules.service.js';
import { InventoryReconciliationService } from './services/inventory-reconciliation.service.js';
import { ListingContentSync } from './services/listing-content.sync.js';
import { ListingDraftBuilder } from './services/listing-draft.builder.js';
import { ListingInventorySync } from './services/listing-inventory.sync.js';
import { ListingOverrideWriter } from './services/listing-override.writer.js';
import { ListingOverridesService } from './services/listing-overrides.service.js';
import { ListingPriceSync } from './services/listing-price.sync.js';
import { ListingSyncFailures } from './services/listing-sync-failures.js';
import { ListingSyncOutcomes } from './services/listing-sync-outcomes.js';
import { ListingSyncExecutors, ListingSyncRunner } from './services/listing-sync.runner.js';
import { ListingSyncScheduler } from './services/listing-sync.scheduler.js';
import { ListingTargetResolver } from './services/listing-target.resolver.js';
import { PricingPreviewService } from './services/pricing-preview.service.js';
import { ProductChannelViews } from './services/product-channel.views.js';
import { ProductChannelsService } from './services/product-channels.service.js';
import { ProductSelectionService } from './services/product-selection.service.js';
import { SyncConnectionLoader } from './services/sync-connection.loader.js';
import { SyncJobQueue } from './services/sync-job.queue.js';
import { SyncPlanner } from './services/sync-planner.js';
import { SyncProductLoader } from './services/sync-product.loader.js';

/**
 * Listings on channels: pricing rules and price resolution, product selection, per-channel
 * overrides, and the sync jobs that publish listings and keep their price and stock current.
 * The API enqueues jobs; `apps/worker` runs them with `ListingSyncRunner`.
 */
@Module({
  imports: [ActivityModule, CatalogModule, ChannelsModule, EventsModule],
  providers: [
    ListingSyncRepository,
    ListingOverrideRepository,
    ProductSelectionRepository,
    ChannelPriceResolver,
    ProductSelectionService,
    SyncConnectionLoader,
    SyncProductLoader,
    ListingDraftBuilder,
    ListingTargetResolver,
    ListingSyncFailures,
    ListingSyncOutcomes,
    ListingContentSync,
    ListingPriceSync,
    ListingInventorySync,
    ListingSyncExecutors,
    ListingSyncRunner,
    ListingSyncScheduler,
    SyncPlanner,
    ChannelSyncService,
    ChannelListingsService,
    ChannelProductsService,
    StoreMembershipService,
    SelectionApplier,
    StoreMembershipWriter,
    ChannelProductsRepository,
    ConnectionRulesService,
    PricingPreviewService,
    ProductChannelViews,
    ProductChannelsService,
    ListingOverrideWriter,
    ListingOverridesService,
    InventoryReconciliationService,
    { provide: SyncJobQueue, useClass: BullSyncJobQueue },
  ],
  exports: [
    ChannelPriceResolver,
    ProductSelectionService,
    ChannelSyncService,
    ChannelListingsService,
    ChannelProductsService,
    StoreMembershipService,
    SelectionApplier,
    ConnectionRulesService,
    PricingPreviewService,
    ProductChannelsService,
    ListingOverridesService,
    ListingSyncRunner,
    InventoryReconciliationService,
    SyncJobQueue,
  ],
})
export class ListingsModule {}
