import { Module } from '@nestjs/common';
import { WebhookOutbox } from './services/webhook-outbox.js';

/**
 * The outbox alone, for domain modules that publish events (orders, inventory, catalog,
 * listings). It depends on nothing but the database, so publishing never creates a module cycle.
 */
@Module({
  providers: [WebhookOutbox],
  exports: [WebhookOutbox],
})
export class WebhookOutboxModule {}
