import { Module } from '@nestjs/common';
import { PlanCatalogRepository } from './repositories/plan-catalog.repository.js';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { UsageRepository } from './repositories/usage.repository.js';
import { EntitlementEnforcement } from './services/entitlement-enforcement.js';
import { EntitlementService } from './services/entitlement.service.js';
import { OrganizationPlanService } from './services/organization-plan.service.js';
import { PlanCatalogService } from './services/plan-catalog.service.js';
import { SubscriptionService } from './services/subscription.service.js';
import { UsageMeter } from './services/usage-meter.js';

/**
 * Plans as data: versioned plan features, each organization's subscription, usage counted from
 * the data, and `EntitlementService`, which answers every limit and feature check.
 */
@Module({
  providers: [
    PlanCatalogRepository,
    SubscriptionRepository,
    UsageRepository,
    EntitlementEnforcement,
    UsageMeter,
    OrganizationPlanService,
    EntitlementService,
    SubscriptionService,
    PlanCatalogService,
  ],
  exports: [EntitlementService, OrganizationPlanService, SubscriptionService, PlanCatalogService],
})
export class EntitlementsModule {}
