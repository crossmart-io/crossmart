import { Injectable, type OnModuleInit } from '@nestjs/common';
import type {
  ChannelEventListener,
  OrderChangedEvent,
} from '../../events/entities/channel-events.js';
import { ChannelEventBus } from '../../events/services/channel-event-bus.js';
import { OrderJobQueue } from '../queue/order-job.queue.js';

/** Queues a read of each order a webhook says changed; the worker reads and ingests it. */
@Injectable()
export class OrderWebhookListener implements ChannelEventListener, OnModuleInit {
  constructor(
    private readonly events: ChannelEventBus,
    private readonly queue: OrderJobQueue,
  ) {}

  onModuleInit(): void {
    this.events.subscribe(this);
  }

  onOrderChanged(event: OrderChangedEvent): Promise<void> {
    return this.queue.enqueueFetch(event);
  }
}
