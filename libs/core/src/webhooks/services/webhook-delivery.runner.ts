import { Injectable, Logger } from '@nestjs/common';
import type { DeliveryAttemptResult } from '../entities/delivery-attempt.js';
import type { DeliveryRef } from '../entities/delivery-ref.js';
import { WebhookDeliveryFailure } from '../enums/webhook-delivery-failure.enum.js';
import { resultOfFailure } from '../rules/delivery-response.js';
import { toWebhookEnvelope } from '../rules/webhook-envelope.js';
import { buildWebhookRequest } from '../rules/webhook-request.js';
import type { DeliveryToSend } from '../repositories/webhook-delivery.queries.js';
import { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import { WEBHOOK_DELIVERY_LEASE_MS } from '../webhooks.constants.js';
import { WebhookDeliveryOutcomes } from './webhook-delivery.outcomes.js';
import { WebhookSecretVault } from './webhook-secret.vault.js';
import { WebhookSender } from './webhook-sender.js';

const NO_TIME = 0;

/** Makes one attempt at one delivery, as a `deliver` job asks. */
@Injectable()
export class WebhookDeliveryRunner {
  private readonly logger = new Logger(WebhookDeliveryRunner.name);

  constructor(
    private readonly deliveries: WebhookDeliveryRepository,
    private readonly secrets: WebhookSecretVault,
    private readonly sender: WebhookSender,
    private readonly outcomes: WebhookDeliveryOutcomes,
  ) {}

  async deliver(ref: DeliveryRef): Promise<void> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + WEBHOOK_DELIVERY_LEASE_MS);
    const delivery = await this.deliveries.startAttempt(ref, leaseUntil);
    if (!delivery) return;
    const result = await this.attempt(delivery, now);
    await this.outcomes.record(ref, delivery, result);
  }

  private async attempt(delivery: DeliveryToSend, now: Date): Promise<DeliveryAttemptResult> {
    const { endpoint } = delivery;
    const ref = { workspaceId: endpoint.workspaceId, endpointId: endpoint.id };
    const secrets = await this.secrets.signingSecrets(ref, endpoint, now).catch(() => null);
    if (!secrets) {
      // Logged by id only: the reason may come from the key ring and must never carry a key.
      this.logger.error(`Could not open the signing secret of webhook endpoint ${endpoint.id}`);
      return resultOfFailure(WebhookDeliveryFailure.SecretUnavailable, NO_TIME);
    }
    const request = buildWebhookRequest({
      url: endpoint.url,
      deliveryId: delivery.id,
      envelope: toWebhookEnvelope(delivery.event),
      secrets,
      sentAt: now,
    });
    return this.sender.send(request);
  }
}
