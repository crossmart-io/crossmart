import { Module } from '@nestjs/common';
import { OrdersModule } from '@crossmart/core';
import { OrderPollScheduler } from './order-poll.scheduler.js';
import { OrdersProcessor } from './orders.processor.js';

@Module({
  imports: [OrdersModule],
  providers: [OrdersProcessor, OrderPollScheduler],
})
export class OrdersWorkerModule {}
