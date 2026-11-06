import { Module } from '@nestjs/common';
import { WebhooksModule } from '@crossmart/core';
import { WebhookDeliveriesController } from './controllers/webhook-deliveries.controller.js';
import { WebhookEndpointsController } from './controllers/webhook-endpoints.controller.js';

/** Outgoing webhooks: endpoints, their secrets and their delivery logs (ADR 0023). */
@Module({
  imports: [WebhooksModule],
  controllers: [WebhookEndpointsController, WebhookDeliveriesController],
})
export class WebhooksApiModule {}
