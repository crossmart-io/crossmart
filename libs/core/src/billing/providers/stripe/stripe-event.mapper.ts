import type Stripe from 'stripe';
import type { BillingWebhookEvent } from '../../entities/billing-webhook-event.js';
import { BillingEventType } from '../../enums/billing-event-type.enum.js';
import { stripeId } from './stripe-subscription.mapper.js';
import { STRIPE_EVENT, STRIPE_EVENT_TYPES } from './stripe.constants.js';

/** The ids an event carries, which name the subscription and organization to reconcile. */
type EventIds = Pick<BillingWebhookEvent, 'subscriptionId' | 'customerId' | 'organizationId'>;

const NO_IDS: EventIds = { subscriptionId: null, customerId: null, organizationId: null };
const SUBSCRIPTION_MODE: Stripe.Checkout.Session.Mode = 'subscription';

function checkoutIds(session: Stripe.Checkout.Session): EventIds {
  if (session.mode !== SUBSCRIPTION_MODE) return NO_IDS;
  return {
    subscriptionId: stripeId(session.subscription),
    customerId: stripeId(session.customer),
    organizationId: session.client_reference_id,
  };
}

function subscriptionIds(subscription: Stripe.Subscription): EventIds {
  return {
    subscriptionId: subscription.id,
    customerId: stripeId(subscription.customer),
    organizationId: null,
  };
}

/** Since API 2025-03-31 an invoice names its subscription under `parent`. */
function invoiceIds(invoice: Stripe.Invoice): EventIds {
  return {
    subscriptionId: stripeId(invoice.parent?.subscription_details?.subscription),
    customerId: stripeId(invoice.customer),
    organizationId: null,
  };
}

function idsOf(event: Stripe.Event): EventIds {
  switch (event.type) {
    case STRIPE_EVENT.CheckoutSessionCompleted:
      return checkoutIds(event.data.object);
    case STRIPE_EVENT.SubscriptionCreated:
    case STRIPE_EVENT.SubscriptionUpdated:
    case STRIPE_EVENT.SubscriptionDeleted:
    case STRIPE_EVENT.SubscriptionTrialWillEnd:
      return subscriptionIds(event.data.object);
    case STRIPE_EVENT.InvoicePaid:
    case STRIPE_EVENT.InvoicePaymentFailed:
      return invoiceIds(event.data.object);
    default:
      return NO_IDS;
  }
}

/** A verified Stripe event in Crossmart's terms; events Crossmart does not act on have no type. */
export function toBillingWebhookEvent(event: Stripe.Event): BillingWebhookEvent {
  const type: BillingEventType | null = STRIPE_EVENT_TYPES[event.type] ?? null;
  return { id: event.id, providerType: event.type, type, ...idsOf(event) };
}
