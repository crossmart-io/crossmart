import { NotFoundException } from '@nestjs/common';
import { BILLING_NOT_ENABLED } from '../billing.constants.js';
import type { BillingWebhookEvent } from '../entities/billing-webhook-event.js';
import type { HostedSession } from '../entities/billing-sessions.js';
import type { ProviderPrice } from '../entities/provider-price.js';
import type { ProviderSubscription } from '../entities/provider-subscription.js';
import { BillingProvider } from './billing-provider.js';

/**
 * Billing turned off (`BILLING_DRIVER=none`), as self-hosting runs: no plan has a price, and
 * anything that would charge answers 404.
 */
export class DisabledBillingProvider extends BillingProvider {
  findPrices(): Promise<ProviderPrice[]> {
    return Promise.resolve([]);
  }

  createCustomer(): Promise<string> {
    return Promise.reject(new NotFoundException(BILLING_NOT_ENABLED));
  }

  createCheckoutSession(): Promise<HostedSession> {
    return Promise.reject(new NotFoundException(BILLING_NOT_ENABLED));
  }

  createPortalSession(): Promise<HostedSession> {
    return Promise.reject(new NotFoundException(BILLING_NOT_ENABLED));
  }

  getSubscription(): Promise<ProviderSubscription> {
    return Promise.reject(new NotFoundException(BILLING_NOT_ENABLED));
  }

  parseWebhook(): BillingWebhookEvent {
    throw new NotFoundException(BILLING_NOT_ENABLED);
  }
}
