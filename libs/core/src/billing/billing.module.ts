import { Module } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { BillingProvider } from './providers/billing-provider.js';
import { createBillingProvider } from './providers/billing-provider.factory.js';
import { BillingAccountRepository } from './repositories/billing-account.repository.js';
import { BillingEventRepository } from './repositories/billing-event.repository.js';
import { BillingAccountService } from './services/billing-account.service.js';
import { BillingCheckoutService } from './services/billing-checkout.service.js';
import { BillingPlansService } from './services/billing-plans.service.js';
import { BillingStatusService } from './services/billing-status.service.js';
import { BillingWebhookService } from './services/billing-webhook.service.js';
import { SubscriptionSyncService } from './services/subscription-sync.service.js';

/**
 * Billing for Crossmart Cloud (ADR 0024), behind `BillingProvider`: plan prices, checkout, the
 * billing portal and provider webhooks. With `BILLING_DRIVER=none` it is all off.
 */
@Module({
  imports: [EntitlementsModule],
  providers: [
    { provide: BillingProvider, useFactory: createBillingProvider, inject: [AppConfigService] },
    BillingAccountRepository,
    BillingEventRepository,
    SubscriptionSyncService,
    BillingAccountService,
    BillingPlansService,
    BillingStatusService,
    BillingAccountService,
    BillingCheckoutService,
    BillingWebhookService,
  ],
  exports: [
    BillingPlansService,
    BillingStatusService,
    BillingAccountService,
    BillingCheckoutService,
    BillingWebhookService,
  ],
})
export class BillingModule {}
