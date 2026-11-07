import { Injectable, Logger } from '@nestjs/common';
import type { BillingWebhookEvent } from '../entities/billing-webhook-event.js';
import { BillingEventType } from '../enums/billing-event-type.enum.js';
import { BillingProvider } from '../providers/billing-provider.js';
import { BillingAccountRepository } from '../repositories/billing-account.repository.js';
import { BillingEventRepository } from '../repositories/billing-event.repository.js';
import { SubscriptionSyncService } from './subscription-sync.service.js';

/**
 * Handles the billing provider's webhooks (ADR 0024). Each event is verified, handled once, and
 * reconciled against the subscription as the provider holds it now, not as the event describes
 * it, so events arriving late or out of order cannot leave an old state behind.
 */
@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);

  constructor(
    private readonly provider: BillingProvider,
    private readonly events: BillingEventRepository,
    private readonly accounts: BillingAccountRepository,
    private readonly sync: SubscriptionSyncService,
  ) {}

  /** Throws `InvalidWebhookSignatureError` (400) for a delivery the provider did not sign. */
  async handle(rawBody: Buffer, signature: string | undefined): Promise<void> {
    const event = this.provider.parseWebhook(rawBody, signature);
    if (!event.type) return;
    if (!(await this.events.claim(event.id, event.providerType))) {
      this.logger.log(`Billing event ${event.id} was already handled`);
      return;
    }
    try {
      await this.process(event);
    } catch (error) {
      // Not recorded as handled, so the provider's retry gets another go.
      await this.events.release(event.id);
      throw error;
    }
  }

  private async process(event: BillingWebhookEvent): Promise<void> {
    if (
      event.type === BillingEventType.CheckoutCompleted &&
      event.organizationId &&
      event.customerId
    ) {
      await this.accounts.saveCustomerId(event.organizationId, event.customerId);
    }
    if (!event.subscriptionId) return;
    const subscription = await this.provider.getSubscription(event.subscriptionId);
    await this.sync.apply(subscription, event.organizationId);
    if (event.type === BillingEventType.TrialWillEnd) {
      this.logger.log(`Trial of billing subscription ${subscription.id} ends soon`);
    }
  }
}
