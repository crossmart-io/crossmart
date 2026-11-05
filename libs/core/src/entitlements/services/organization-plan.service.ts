import { Injectable } from '@nestjs/common';
import type { PlanSnapshot } from '../entities/plan-snapshot.js';
import { NO_DEFAULT_PLAN } from '../entitlements.constants.js';
import { toPlanSnapshot } from '../mappers/plan-snapshot.mapper.js';
import {
  type SubscriptionRecord,
  SubscriptionRepository,
} from '../repositories/subscription.repository.js';

/** The plan version each organization is on, and the one new organizations start on. */
@Injectable()
export class OrganizationPlanService {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  /**
   * The organization's plan. One without a subscription (created before plans existed, or by a
   * path that skipped it) is put on the default plan, so every organization always has one.
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

  private async subscribeToDefault(organizationId: string): Promise<SubscriptionRecord> {
    return this.subscriptions.subscribe(organizationId, await this.defaultPlanVersionId());
  }
}
