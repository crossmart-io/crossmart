import { Module } from '@nestjs/common';
import { WebhooksModule } from '@crossmart/core';
import { WebhookSchedulers } from './webhook.schedulers.js';
import { WebhooksProcessor } from './webhooks.processor.js';

/** Sends outgoing webhooks: dispatch, delivery with retries, and retention (ADR 0023). */
@Module({
  imports: [WebhooksModule],
  providers: [WebhooksProcessor, WebhookSchedulers],
})
export class WebhooksWorkerModule {}
