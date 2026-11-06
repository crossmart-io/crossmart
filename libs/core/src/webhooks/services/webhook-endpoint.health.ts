import { Injectable, Logger } from '@nestjs/common';
import { WebhookDisabledReason } from '@crossmart/database';
import type { DeliveryEndpoint } from '../repositories/webhook-delivery.queries.js';
import { WebhookEndpointRepository } from '../repositories/webhook-endpoint.repository.js';
import { WEBHOOK_DISABLE_AFTER_CONSECUTIVE_FAILURES } from '../webhooks.constants.js';
import { WebhookEndpointNotifier } from './webhook-endpoint.notifier.js';

/**
 * Watches endpoints that keep failing: after too many failed attempts in a row, across events,
 * the endpoint is turned off, what it still had to receive is failed, and the workspace is told.
 */
@Injectable()
export class WebhookEndpointHealth {
  private readonly logger = new Logger(WebhookEndpointHealth.name);

  constructor(
    private readonly endpoints: WebhookEndpointRepository,
    private readonly notifier: WebhookEndpointNotifier,
  ) {}

  async recordFailure(endpoint: DeliveryEndpoint): Promise<void> {
    const count = await this.endpoints.addFailure(endpoint.id);
    if (!count?.enabled) return;
    if (count.consecutiveFailures < WEBHOOK_DISABLE_AFTER_CONSECUTIVE_FAILURES) return;
    const disabled = await this.endpoints.disable(
      endpoint.workspaceId,
      endpoint.id,
      WebhookDisabledReason.FAILING,
      new Date(),
    );
    if (!disabled) return;
    this.logger.warn(`Turned off webhook endpoint ${endpoint.id} after repeated failures`);
    await this.notifier.endpointDisabled({
      id: endpoint.id,
      workspaceId: endpoint.workspaceId,
      url: endpoint.url,
      failures: count.consecutiveFailures,
    });
  }
}
