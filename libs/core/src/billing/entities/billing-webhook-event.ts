import type { BillingEventType } from '../enums/billing-event-type.enum.js';

/** A verified webhook event from the billing provider, with the ids Crossmart needs from it. */
export interface BillingWebhookEvent {
  /** The provider's event id, which makes handling idempotent. */
  id: string;
  /** The provider's own event name, kept with the handled event. */
  providerType: string;
  /** Null for events Crossmart does not act on. */
  type: BillingEventType | null;
  subscriptionId: string | null;
  customerId: string | null;
  /** Set when the event names the organization (checkout's client reference). */
  organizationId: string | null;
}
