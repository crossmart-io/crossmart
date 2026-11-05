import { Injectable } from '@nestjs/common';
import type { SubscriptionOverview } from '../entities/entitlement-check.js';
import { Feature } from '../enums/feature.enum.js';
import { EntitlementEnforcement } from './entitlement-enforcement.js';
import { OrganizationPlanService } from './organization-plan.service.js';
import { UsageMeter } from './usage-meter.js';

/** An organization's plan with its usage of every feature, for the plan and usage page. */
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly plans: OrganizationPlanService,
    private readonly meter: UsageMeter,
    private readonly enforcement: EntitlementEnforcement,
  ) {}

  async overview(organizationId: string): Promise<SubscriptionOverview> {
    const [{ grants, ...snapshot }, scope] = await Promise.all([
      this.plans.current(organizationId),
      this.meter.scopeOf(organizationId),
    ]);
    const usage = await this.meter.countAll(scope, Object.values(Feature));
    return {
      ...snapshot,
      enforced: this.enforcement.enforced,
      features: [...grants.values()].map((grant) => ({
        ...grant,
        usage: usage.get(grant.feature) ?? null,
      })),
    };
  }
}
