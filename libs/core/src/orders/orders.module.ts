import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { EventsModule } from '../events/events.module.js';
import { BullOrderJobQueue } from './queue/bull-order-job.queue.js';
import { OrderJobQueue } from './queue/order-job.queue.js';
import { OrderRepository } from './repositories/order.repository.js';
import { OrderVariantMatcher } from './repositories/order-variant.matcher.js';
import { OrderWriter } from './repositories/order.writer.js';
import { OrderIngestionService } from './services/order-ingestion.service.js';
import { OrderRetentionService } from './services/order-retention.service.js';
import { OrderSyncService } from './services/order-sync.service.js';
import { OrderWebhookListener } from './services/order-webhook.listener.js';
import { OrdersService } from './services/orders.service.js';

/**
 * Channel orders: webhooks and polling read them (`OrderSyncService`, in the worker), and
 * ingestion stores them and reserves their stock. Needs the global `QueuesModule`.
 */
@Module({
  imports: [ActivityModule, ChannelsModule, EventsModule],
  providers: [
    OrderRepository,
    OrderVariantMatcher,
    OrderWriter,
    OrderIngestionService,
    OrderRetentionService,
    OrderSyncService,
    OrderWebhookListener,
    OrdersService,
    { provide: OrderJobQueue, useClass: BullOrderJobQueue },
  ],
  exports: [
    OrdersService,
    OrderSyncService,
    OrderIngestionService,
    OrderRetentionService,
    OrderJobQueue,
  ],
})
export class OrdersModule {}
