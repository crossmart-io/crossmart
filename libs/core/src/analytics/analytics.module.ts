import { Module } from '@nestjs/common';
import { SalesRepository } from './repositories/sales.repository.js';
import { SalesAnalyticsService } from './services/sales-analytics.service.js';

/** Reports over the workspace's orders, such as sales over time for the overview. */
@Module({
  providers: [SalesRepository, SalesAnalyticsService],
  exports: [SalesAnalyticsService],
})
export class AnalyticsModule {}
