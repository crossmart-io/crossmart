import { Module } from '@nestjs/common';
import { OrdersModule } from '@crossmart/core';
import { OrdersController } from './controllers/orders.controller.js';

/** Order endpoints; importing `OrdersModule` also routes order webhooks to the worker. */
@Module({
  imports: [OrdersModule],
  controllers: [OrdersController],
})
export class OrdersApiModule {}
