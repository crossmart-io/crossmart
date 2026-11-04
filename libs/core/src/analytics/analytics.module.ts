import { Module } from '@nestjs/common';
import { WorkspaceSettingsModule } from '../workspace-settings/workspace-settings.module.js';
import { InventoryReportRepository } from './repositories/inventory-report.repository.js';
import { SalesRepository } from './repositories/sales.repository.js';
import { InventoryReportService } from './services/inventory-report.service.js';
import { SalesAnalyticsService } from './services/sales-analytics.service.js';

/** The overview's reports: sales over the workspace's orders, and stock and store health. */
@Module({
  imports: [WorkspaceSettingsModule],
  providers: [
    SalesRepository,
    SalesAnalyticsService,
    InventoryReportRepository,
    InventoryReportService,
  ],
  exports: [SalesAnalyticsService, InventoryReportService],
})
export class AnalyticsModule {}
