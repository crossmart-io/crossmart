import { Module } from '@nestjs/common';
import { ActivityModule } from '../../activity/activity.module.js';
import { CatalogModule } from '../../catalog/catalog.module.js';
import { InventoryModule } from '../../inventory/inventory.module.js';
import { ChannelsModule } from '../channels.module.js';
import { BullChannelImportQueue } from './queue/bull-channel-import.queue.js';
import { ChannelImportQueue } from './queue/channel-import.queue.js';
import { CatalogMatchRepository } from './repositories/catalog-match.repository.js';
import { ChannelImportJobRepository } from './repositories/channel-import-job.repository.js';
import { CatalogPageImporter } from './services/catalog-page.importer.js';
import { ChannelCatalogOpener } from './services/channel-catalog.opener.js';
import { ChannelImportReporter } from './services/channel-import.reporter.js';
import { ChannelImportRunner } from './services/channel-import.runner.js';
import { ChannelImportService } from './services/channel-import.service.js';
import { ChannelProductCreator } from './services/channel-product.creator.js';
import { ProductMatcher } from './services/product-matcher.js';
import { StalledImportSweeper } from './services/stalled-import.sweeper.js';

/**
 * Imports a connected channel's catalog: the API starts an import (`ChannelImportService`),
 * and the worker runs it (`ChannelImportRunner`) from the `import` queue. Needs the global
 * `QueuesModule` in the app that hosts it.
 */
@Module({
  imports: [ActivityModule, CatalogModule, ChannelsModule, InventoryModule],
  providers: [
    CatalogMatchRepository,
    ChannelImportJobRepository,
    ProductMatcher,
    ChannelProductCreator,
    CatalogPageImporter,
    ChannelCatalogOpener,
    ChannelImportReporter,
    ChannelImportRunner,
    ChannelImportService,
    StalledImportSweeper,
    { provide: ChannelImportQueue, useClass: BullChannelImportQueue },
  ],
  exports: [ChannelImportService, ChannelImportRunner, ChannelImportQueue, StalledImportSweeper],
})
export class ChannelImportModule {}
