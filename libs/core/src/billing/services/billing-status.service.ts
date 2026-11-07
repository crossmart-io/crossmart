import { Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { OrganizationPlanService } from '../../entitlements/services/organization-plan.service.js';
import { SubscriptionAccessPolicy } from '../../entitlements/services/subscription-access-policy.js';
import { NO_BILLING_ACCOUNT } from '../billing.constants.js';
import type { BillingStatus } from '../entities/billing-status.js';
import { BillingAccountRepository } from '../repositories/billing-account.repository.js';
import { isTrialAvailable } from '../rules/billing-account.js';

/** An organization's subscription as its billing page shows it (ADR 0024). */
@Injectable()
export class BillingStatusService {
  constructor(
    private readonly accounts: BillingAccountRepository,
    private readonly organizationPlans: OrganizationPlanService,
    private readonly subscriptionAccess: SubscriptionAccessPolicy,
    private readonly appConfig: AppConfigService,
  ) {}

  async status(organizationId: string): Promise<BillingStatus> {
    const { plan } = await this.organizationPlans.current(organizationId);
    const [account, access] = await Promise.all([
      this.accounts.findByOrganization(organizationId),
      this.subscriptionAccess.access(organizationId),
    ]);
    if (!account) throw new NotFoundException(NO_BILLING_ACCOUNT);
    const enabled = this.appConfig.billingEnabled;
    return {
      organizationId,
      enabled,
      enforced: this.subscriptionAccess.enforced,
      plan,
      status: account.status,
      interval: account.billingInterval,
      currentPeriodEnd: account.currentPeriodEnd,
      trialEnd: account.trialEnd,
      cancelAtPeriodEnd: account.cancelAtPeriodEnd,
      cancelAt: account.cancelAt,
      access,
      hasBillingAccount: account.externalCustomerId !== null,
      trialAvailable: enabled && isTrialAvailable(account),
    };
  }
}
