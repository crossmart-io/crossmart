import { ConflictException, Injectable } from '@nestjs/common';
import { SandboxRestriction } from '../../entitlements/enums/sandbox-restriction.enum.js';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { ALREADY_SUBSCRIBED } from '../billing.constants.js';
import type { CheckoutStart, HostedSession } from '../entities/billing-sessions.js';
import { BillingProvider } from '../providers/billing-provider.js';
import { hasLiveSubscription } from '../rules/billing-account.js';
import { BillingAccountService } from './billing-account.service.js';
import { BillingPlansService } from './billing-plans.service.js';

/**
 * Starts a subscription on the provider's hosted checkout (ADR 0024), with a trial the first
 * time and the card collected even then. Plan changes afterwards go through the billing portal.
 */
@Injectable()
export class BillingCheckoutService {
  constructor(
    private readonly accounts: BillingAccountService,
    private readonly plans: BillingPlansService,
    private readonly entitlements: EntitlementService,
    private readonly provider: BillingProvider,
  ) {}

  /** An unclaimed sandbox cannot pay (ADR 0019), and a live subscription changes in the portal. */
  async startCheckout(start: CheckoutStart): Promise<HostedSession> {
    this.accounts.assertEnabled();
    await this.entitlements.assertSandboxAllowsInOrganization(
      start.organizationId,
      SandboxRestriction.Subscribe,
    );
    const account = await this.accounts.get(start.organizationId);
    if (hasLiveSubscription(account)) throw new ConflictException(ALREADY_SUBSCRIBED);
    const price = await this.plans.priceFor(start.planCode, start.interval);
    return this.provider.createCheckoutSession({
      organizationId: start.organizationId,
      customerId: await this.accounts.customerOf(account, start.email),
      priceId: price.id,
      planCode: start.planCode,
      trialDays: this.accounts.trialDaysFor(account),
    });
  }
}
