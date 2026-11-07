import { Module } from '@nestjs/common';
import { PlanCatalogRepository } from './repositories/plan-catalog.repository.js';
import { SandboxStatusRepository } from './repositories/sandbox-status.repository.js';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { UsageRepository } from './repositories/usage.repository.js';
import { EntitlementEnforcement } from './services/entitlement-enforcement.js';
import { EntitlementService } from './services/entitlement.service.js';
import { OrganizationPlanService } from './services/organization-plan.service.js';
import { PlanCatalogService } from './services/plan-catalog.service.js';
import { SandboxPolicy } from './services/sandbox-policy.js';
import { SubscriptionAccessPolicy } from './services/subscription-access-policy.js';
import { SubscriptionService } from './services/subscription.service.js';
import { UsageMeter } from './services/usage-meter.js';

/**
 * Plans as data: versioned plan features, each organization's subscription, usage counted from
 * the data, and `EntitlementService`, which answers every limit and feature check, and what an
 * unclaimed sandbox account may not do.
 */
@Module({
  providers: [
    PlanCatalogRepository,
    SubscriptionRepository,
    UsageRepository,
    SandboxStatusRepository,
    SandboxPolicy,
    SubscriptionAccessPolicy,
    EntitlementEnforcement,
    UsageMeter,
    OrganizationPlanService,
    EntitlementService,
    SubscriptionService,
    PlanCatalogService,
  ],
  exports: [
    EntitlementService,
    OrganizationPlanService,
    SubscriptionService,
    PlanCatalogService,
    SubscriptionAccessPolicy,
  ],
})
export class EntitlementsModule {}
