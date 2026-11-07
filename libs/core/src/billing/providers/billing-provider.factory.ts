import Stripe from 'stripe';
import { type AppConfigService, BillingDriver } from '@crossmart/common';
import { BILLING_WEB_PAGES } from '../billing.constants.js';
import type { BillingReturnPages } from '../entities/billing-sessions.js';
import type { BillingProvider } from './billing-provider.js';
import { DisabledBillingProvider } from './disabled-billing.provider.js';
import { StripeBillingProvider } from './stripe/stripe-billing.provider.js';
import { STRIPE_APP_INFO, STRIPE_MAX_NETWORK_RETRIES } from './stripe/stripe.constants.js';

/** The web app's billing pages, as absolute URLs the provider's hosted pages return to. */
export function billingReturnPages(webAppUrl: string): BillingReturnPages {
  const page = (path: string): string => new URL(path, webAppUrl).toString();
  return {
    checkoutSuccessUrl: page(BILLING_WEB_PAGES.checkoutSuccess),
    checkoutCancelUrl: page(BILLING_WEB_PAGES.checkoutCanceled),
    portalReturnUrl: page(BILLING_WEB_PAGES.settings),
  };
}

/** The provider `BILLING_DRIVER` names; billing is off without one, as self-hosting runs. */
export function createBillingProvider(appConfig: AppConfigService): BillingProvider {
  const { driver, stripe } = appConfig.billingSettings;
  if (driver === BillingDriver.None || !stripe) return new DisabledBillingProvider();
  const client = new Stripe(stripe.secretKey, {
    maxNetworkRetries: STRIPE_MAX_NETWORK_RETRIES,
    appInfo: STRIPE_APP_INFO,
  });
  return new StripeBillingProvider(client, stripe.webhookSecret, {
    automaticTax: stripe.automaticTax,
    portalConfigurationId: stripe.portalConfigurationId,
    returnPages: billingReturnPages(appConfig.webAppUrl),
  });
}
