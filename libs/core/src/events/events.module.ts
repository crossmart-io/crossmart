import { Module } from '@nestjs/common';
import { CatalogEventBus } from './services/catalog-event-bus.js';
import { ChannelEventBus } from './services/channel-event-bus.js';

/** In-process catalog and channel events. Import it to publish or subscribe; one bus per app. */
@Module({
  providers: [CatalogEventBus, ChannelEventBus],
  exports: [CatalogEventBus, ChannelEventBus],
})
export class EventsModule {}
