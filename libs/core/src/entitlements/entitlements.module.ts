import { Module } from '@nestjs/common';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { UsageRepository } from './repositories/usage.repository.js';
import { EntitlementEnforcement } from './services/entitlement-enforcement.js';
import { EntitlementService } from './services/entitlement.service.js';
import { OrganizationPlanService } from './services/organization-plan.service.js';
import { SubscriptionService } from './services/subscription.service.js';
import { UsageMeter } from './services/usage-meter.js';

/**
 * Plans as data: versioned plan features, each organization's subscription, usage counted from
 * the data, and `EntitlementService`, which answers every limit and feature check.
 */
@Module({
  providers: [
    SubscriptionRepository,
    UsageRepository,
    EntitlementEnforcement,
    UsageMeter,
    OrganizationPlanService,
    EntitlementService,
    SubscriptionService,
  ],
  exports: [EntitlementService, OrganizationPlanService, SubscriptionService],
})
export class EntitlementsModule {}
