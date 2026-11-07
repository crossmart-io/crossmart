import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@crossmart/database';
import type { PlanSnapshot } from '../entities/plan-snapshot.js';
import type { StartingSubscription } from '../entities/starting-subscription.js';
import { NO_DEFAULT_PLAN } from '../entitlements.constants.js';
import { toPlanSnapshot } from '../mappers/plan-snapshot.mapper.js';
import {
  type SubscriptionRecord,
  SubscriptionRepository,
} from '../repositories/subscription.repository.js';
import { EntitlementEnforcement } from './entitlement-enforcement.js';

/** The plan version each organization is on, and the one new organizations start on. */
@Injectable()
export class OrganizationPlanService {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly enforcement: EntitlementEnforcement,
  ) {}

  /**
   * The organization's plan. One without a subscription (created before plans existed, or by a
   * path that skipped it) is put on the default plan, so every organization always has one. It
   * reads as an organization from before billing (`ACTIVE`), so it is never locked out.
   */
  async current(organizationId: string): Promise<PlanSnapshot> {
    const record =
      (await this.subscriptions.findForOrganization(organizationId)) ??
      (await this.subscribeToDefault(organizationId));
    return toPlanSnapshot(record);
  }

  /** The latest version of the default plan. Throws when the plans were never seeded. */
  async defaultPlanVersionId(): Promise<string> {
    const planVersionId = await this.subscriptions.findDefaultPlanVersionId();
    if (!planVersionId) {
      throw new Error(NO_DEFAULT_PLAN);
    }
    return planVersionId;
  }

  /**
   * What a new organization starts with: the default plan, `INCOMPLETE` until it checks out
   * where billing is on, and `ACTIVE` where it is off.
   */
  async startingSubscription(): Promise<StartingSubscription> {
    return {
      planVersionId: await this.defaultPlanVersionId(),
      status: this.enforcement.billingEnabled
        ? SubscriptionStatus.INCOMPLETE
        : SubscriptionStatus.ACTIVE,
    };
  }

  private async subscribeToDefault(organizationId: string): Promise<SubscriptionRecord> {
    return this.subscriptions.subscribe(organizationId, await this.defaultPlanVersionId());
  }
}
