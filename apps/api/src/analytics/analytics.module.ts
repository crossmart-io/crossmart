import { Module } from '@nestjs/common';
import { AnalyticsModule } from '@crossmart/core';
import { SalesReportController } from './controllers/sales-report.controller.js';

@Module({
  imports: [AnalyticsModule],
  controllers: [SalesReportController],
})
export class AnalyticsApiModule {}
