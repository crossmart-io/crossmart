import { Module } from '@nestjs/common';
import { CatalogEventBus } from './services/catalog-event-bus.js';

/** In-process catalog events. Import it to publish or subscribe; there is one bus per app. */
@Module({
  providers: [CatalogEventBus],
  exports: [CatalogEventBus],
})
export class EventsModule {}
