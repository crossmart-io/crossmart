import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { WorkspaceSettingsModule } from '../workspace-settings/workspace-settings.module.js';
import { InventoryReportRepository } from './repositories/inventory-report.repository.js';
import { SalesRepository } from './repositories/sales.repository.js';
import { InventoryReportService } from './services/inventory-report.service.js';
import { ListingHealthReportService } from './services/listing-health-report.service.js';
import { SalesAnalyticsService } from './services/sales-analytics.service.js';

/** The overview's reports: sales over the workspace's orders, stock, and listing health. */
@Module({
  imports: [ChannelsModule, ListingsModule, WorkspaceSettingsModule],
  providers: [
    SalesRepository,
    SalesAnalyticsService,
    InventoryReportRepository,
    InventoryReportService,
    ListingHealthReportService,
  ],
  exports: [SalesAnalyticsService, InventoryReportService, ListingHealthReportService],
})
export class AnalyticsModule {}
