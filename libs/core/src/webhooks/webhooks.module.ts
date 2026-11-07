import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { CredentialsModule } from '../credentials/credentials.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { BullWebhookJobQueue } from './queue/bull-webhook-job.queue.js';
import { WebhookJobQueue } from './queue/webhook-job.queue.js';
import { WebhookDeliveryRepository } from './repositories/webhook-delivery.repository.js';
import { WebhookEndpointRepository } from './repositories/webhook-endpoint.repository.js';
import { WebhookRecipientRepository } from './repositories/webhook-recipient.repository.js';
import { WebhookDeliveriesService } from './services/webhook-deliveries.service.js';
import { WebhookDeliveryOutcomes } from './services/webhook-delivery.outcomes.js';
import { WebhookDeliveryRunner } from './services/webhook-delivery.runner.js';
import { WebhookDispatcher } from './services/webhook-dispatcher.js';
import { WebhookEndpointAdmission } from './services/webhook-endpoint.admission.js';
import { WebhookEndpointHealth } from './services/webhook-endpoint.health.js';
import { WebhookEndpointNotifier } from './services/webhook-endpoint.notifier.js';
import { WebhookEndpointsService } from './services/webhook-endpoints.service.js';
import { WebhookRetentionService } from './services/webhook-retention.service.js';
import { WebhookSecretVault } from './services/webhook-secret.vault.js';
import { WebhookTransportModule } from './webhook-transport.module.js';

/**
 * Outgoing webhooks (ADR 0023): endpoints and their secrets for the API, and dispatch, delivery
 * and retention for the worker. Domain modules publish events through `WebhookOutboxModule`.
 * Needs the global `QueuesModule` and `MailModule`.
 */
@Module({
  imports: [
    ActivityModule,
    CredentialsModule,
    EntitlementsModule,
    NotificationsModule,
    WebhookTransportModule,
  ],
  providers: [
    WebhookEndpointRepository,
    WebhookDeliveryRepository,
    WebhookRecipientRepository,
    WebhookSecretVault,
    WebhookEndpointAdmission,
    WebhookEndpointsService,
    WebhookDeliveriesService,
    WebhookDispatcher,
    WebhookDeliveryRunner,
    WebhookDeliveryOutcomes,
    WebhookEndpointHealth,
    WebhookEndpointNotifier,
    WebhookRetentionService,
    { provide: WebhookJobQueue, useClass: BullWebhookJobQueue },
  ],
  exports: [
    WebhookEndpointsService,
    WebhookDeliveriesService,
    WebhookDispatcher,
    WebhookDeliveryRunner,
    WebhookRetentionService,
    WebhookJobQueue,
  ],
})
export class WebhooksModule {}
