import { Module } from '@nestjs/common';
import { BillingModule, EntitlementsModule, TenancyModule } from '@crossmart/core';
import { BillingPlansController } from './controllers/billing-plans.controller.js';
import { BillingWebhooksController } from './controllers/billing-webhooks.controller.js';
import { OrganizationBillingController } from './controllers/organization-billing.controller.js';
import { WorkspaceBillingAccessController } from './controllers/workspace-billing-access.controller.js';

/**
 * Billing (ADR 0024): plans with prices, an organization's subscription, checkout and the
 * billing portal, and the provider's webhooks. The read-only guard is registered with the other
 * global guards (`AuthModule`), after the workspace guard it depends on.
 */
@Module({
  imports: [BillingModule, EntitlementsModule, TenancyModule],
  controllers: [
    BillingPlansController,
    OrganizationBillingController,
    WorkspaceBillingAccessController,
    BillingWebhooksController,
  ],
})
export class BillingApiModule {}
