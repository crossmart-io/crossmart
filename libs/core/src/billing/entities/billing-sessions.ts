import type { BillingInterval } from '@crossmart/database';

/** A page the billing provider hosts (Checkout, the Customer Portal), to send the browser to. */
export interface HostedSession {
  url: string;
}

/** Who a new billing customer is. */
export interface NewBillingCustomer {
  organizationId: string;
  name: string;
  email: string;
}

/** A subscription checkout: one plan price, with a trial when the organization has not had one. */
export interface CheckoutRequest {
  organizationId: string;
  customerId: string;
  priceId: string;
  planCode: string;
  /** 0 starts paying at once. */
  trialDays: number;
}

/** Where the provider's hosted pages send the browser back to, in the web app. */
export interface BillingReturnPages {
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
  portalReturnUrl: string;
}

/** What a billing admin starts checkout with. */
export interface CheckoutStart {
  organizationId: string;
  planCode: string;
  interval: BillingInterval;
  /** The billing admin's email, for the provider's receipts. */
  email: string;
}
