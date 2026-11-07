import { type AppConfigService, BillingDriver } from '@crossmart/common';
import { createBillingProvider, billingReturnPages } from './billing-provider.factory.js';
import { DisabledBillingProvider } from './disabled-billing.provider.js';
import { StripeBillingProvider } from './stripe/stripe-billing.provider.js';

function appConfig(driver: BillingDriver): AppConfigService {
  return {
    webAppUrl: 'https://app.crossmart.io',
    billingSettings: {
      driver,
      stripe:
        driver === BillingDriver.Stripe
          ? {
              secretKey: 'sk_test_example',
              webhookSecret: null,
              automaticTax: false,
              portalConfigurationId: null,
            }
          : null,
    },
  } as unknown as AppConfigService;
}

describe('createBillingProvider', () => {
  it('turns billing off without a driver, as self-hosting runs', () => {
    expect(createBillingProvider(appConfig(BillingDriver.None))).toBeInstanceOf(
      DisabledBillingProvider,
    );
  });

  it('bills through Stripe when configured, without calling it', () => {
    expect(createBillingProvider(appConfig(BillingDriver.Stripe))).toBeInstanceOf(
      StripeBillingProvider,
    );
  });

  it('returns people to the web app’s billing pages', () => {
    expect(billingReturnPages('https://app.crossmart.io')).toEqual({
      checkoutSuccessUrl: 'https://app.crossmart.io/settings/billing/checkout/success',
      checkoutCancelUrl: 'https://app.crossmart.io/settings/billing/checkout/canceled',
      portalReturnUrl: 'https://app.crossmart.io/settings/billing',
    });
  });
});
