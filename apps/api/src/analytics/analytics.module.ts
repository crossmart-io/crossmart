import { Module } from '@nestjs/common';
import { AnalyticsModule } from '@crossmart/core';
import { InventoryReportController } from './controllers/inventory-report.controller.js';
import { SalesReportController } from './controllers/sales-report.controller.js';

@Module({
  imports: [AnalyticsModule],
  controllers: [SalesReportController, InventoryReportController],
})
export class AnalyticsApiModule {}
