import type { BillingWebhookEvent } from '../entities/billing-webhook-event.js';
import type {
  CheckoutRequest,
  HostedSession,
  NewBillingCustomer,
} from '../entities/billing-sessions.js';
import type { ProviderPrice } from '../entities/provider-price.js';
import type { ProviderSubscription } from '../entities/provider-subscription.js';

/**
 * Who bills Crossmart Cloud customers (ADR 0024). Stripe implements it; tests use a fake, and a
 * self-hosted instance has none. Crossmart never stores cards: checkout and payment-method
 * changes happen on pages the provider hosts.
 */
export abstract class BillingProvider {
  /** Active recurring prices with these lookup keys; keys without one are left out. */
  abstract findPrices(lookupKeys: readonly string[]): Promise<ProviderPrice[]>;

  /** Creates the organization's customer and returns its id. Safe to repeat for one organization. */
  abstract createCustomer(customer: NewBillingCustomer): Promise<string>;

  /** A hosted checkout that starts a subscription, collecting a card even for a trial. */
  abstract createCheckoutSession(request: CheckoutRequest): Promise<HostedSession>;

  /** The hosted portal where a customer changes plan, card or cancels, and sees invoices. */
  abstract createPortalSession(customerId: string): Promise<HostedSession>;

  /** The subscription as the provider holds it now, which webhooks are reconciled against. */
  abstract getSubscription(subscriptionId: string): Promise<ProviderSubscription>;

  /**
   * Verifies a webhook delivery's signature over its raw body and reads the event. Throws
   * `InvalidWebhookSignatureError` when it was not signed by the provider.
   */
  abstract parseWebhook(rawBody: Buffer, signature: string | undefined): BillingWebhookEvent;
}
