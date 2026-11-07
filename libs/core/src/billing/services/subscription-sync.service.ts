import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus } from '@crossmart/database';
import type { ProviderSubscription } from '../entities/provider-subscription.js';
import type { SubscriptionUpdate } from '../entities/subscription-update.js';
import {
  type BillingAccountRecord,
  BillingAccountRepository,
} from '../repositories/billing-account.repository.js';
import { isLiveStatus } from '../rules/billing-account.js';
import { parsePriceLookupKey } from '../rules/price-lookup-key.js';

/**
 * Brings an organization's subscription in line with the provider's (ADR 0024): status, period,
 * trial and the plan its price names. The plan moves to the plan's latest version, or stays on
 * the version it has when the plan is the same (grandfathering, ADR 0015). `EntitlementService`
 * reads the plan from that row, so limits follow at once.
 */
@Injectable()
export class SubscriptionSyncService {
  private readonly logger = new Logger(SubscriptionSyncService.name);

  constructor(private readonly accounts: BillingAccountRepository) {}

  /** `organizationId` is a hint from the event, used when the subscription does not name one. */
  async apply(subscription: ProviderSubscription, organizationId: string | null): Promise<void> {
    const owner = await this.ownerOf(subscription, organizationId);
    const account = owner ? await this.accounts.findByOrganization(owner) : null;
    if (!owner || !account) {
      this.logger.warn(`No organization for billing subscription ${subscription.id}; ignored`);
      return;
    }
    if (this.isSuperseded(account, subscription)) {
      this.logger.log(`Billing subscription ${subscription.id} was replaced; ignored`);
      return;
    }
    await this.accounts.applySubscription(owner, await this.updateFor(account, subscription));
  }

  private async ownerOf(
    subscription: ProviderSubscription,
    hint: string | null,
  ): Promise<string | null> {
    return (
      subscription.organizationId ??
      hint ??
      (await this.accounts.findOrganizationId({
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
      }))
    );
  }

  /** An older subscription that ended must not undo the organization's newer, live one. */
  private isSuperseded(account: BillingAccountRecord, subscription: ProviderSubscription): boolean {
    return (
      account.externalSubscriptionId !== null &&
      account.externalSubscriptionId !== subscription.id &&
      isLiveStatus(account.status) &&
      !isLiveStatus(subscription.status)
    );
  }

  private async updateFor(
    account: BillingAccountRecord,
    subscription: ProviderSubscription,
  ): Promise<SubscriptionUpdate> {
    return {
      planVersionId: await this.planVersionFor(account, subscription),
      status: subscription.status,
      externalCustomerId: subscription.customerId,
      externalSubscriptionId: subscription.id,
      billingInterval: subscription.interval,
      currentPeriodEnd: subscription.currentPeriodEnd,
      // Kept once set: it is what makes a trial a one-time offer.
      trialEnd: subscription.trialEnd ?? account.trialEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelAt: subscription.cancelAt,
      pastDueSince: this.pastDueSince(account, subscription.status),
    };
  }

  private async planVersionFor(
    account: BillingAccountRecord,
    subscription: ProviderSubscription,
  ): Promise<string> {
    const planCode = subscription.priceLookupKeys
      .map((key) => parsePriceLookupKey(key)?.planCode)
      .find((code) => code !== undefined);
    if (!planCode || planCode === account.planVersion.plan.code) return account.planVersionId;
    const planVersionId = await this.accounts.findLatestPlanVersionId(planCode);
    if (!planVersionId) {
      this.logger.warn(`Billing subscription ${subscription.id} names unknown plan ${planCode}`);
    }
    return planVersionId ?? account.planVersionId;
  }

  /** The grace period runs from the first failure, not from each retry. */
  private pastDueSince(account: BillingAccountRecord, status: SubscriptionStatus): Date | null {
    if (status !== SubscriptionStatus.PAST_DUE) return null;
    return account.status === SubscriptionStatus.PAST_DUE && account.pastDueSince
      ? account.pastDueSince
      : new Date();
  }
}
