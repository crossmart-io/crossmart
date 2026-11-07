import { Injectable, Logger } from '@nestjs/common';
import { RESYNC_PAGE_SIZE } from '../billing.constants.js';
import type { SubscriptionResyncResult } from '../entities/subscription-resync-result.js';
import { SubscriptionResyncOutcome } from '../enums/subscription-resync-outcome.enum.js';
import { BillingProvider } from '../providers/billing-provider.js';
import { BillingAccountRepository } from '../repositories/billing-account.repository.js';
import { SubscriptionSyncService } from './subscription-sync.service.js';

/**
 * Reads organizations' subscriptions from the billing provider and applies them the way a webhook
 * does (ADR 0024). It repairs a row a missed or misread webhook left behind, without waiting for
 * the provider's next event.
 */
@Injectable()
export class SubscriptionResyncService {
  private readonly logger = new Logger(SubscriptionResyncService.name);

  constructor(
    private readonly provider: BillingProvider,
    private readonly accounts: BillingAccountRepository,
    private readonly sync: SubscriptionSyncService,
  ) {}

  async resync(organizationId: string): Promise<SubscriptionResyncResult> {
    const account = await this.accounts.findByOrganization(organizationId);
    const subscriptionId = account?.externalSubscriptionId ?? null;
    if (!account || !subscriptionId) {
      const outcome = account
        ? SubscriptionResyncOutcome.NoSubscription
        : SubscriptionResyncOutcome.NotFound;
      return { organizationId, outcome, subscriptionId: null };
    }
    const subscription = await this.provider.getSubscription(subscriptionId);
    await this.sync.apply(subscription, organizationId);
    return { organizationId, outcome: SubscriptionResyncOutcome.Synced, subscriptionId };
  }

  /**
   * Every organization with a provider subscription, a page at a time, one after another. One
   * that fails is reported as failed, and the rest still run.
   */
  async *resyncAll(): AsyncGenerator<SubscriptionResyncResult> {
    let after: string | null = null;
    for (;;) {
      const page = await this.accounts.findSubscribedOrganizationIds(after, RESYNC_PAGE_SIZE);
      for (const organizationId of page) yield await this.resyncOrReportFailure(organizationId);
      if (page.length < RESYNC_PAGE_SIZE) return;
      after = page.at(-1) ?? null;
    }
  }

  private async resyncOrReportFailure(organizationId: string): Promise<SubscriptionResyncResult> {
    try {
      return await this.resync(organizationId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Resyncing the subscription of ${organizationId} failed: ${reason}`);
      return { organizationId, outcome: SubscriptionResyncOutcome.Failed, subscriptionId: null };
    }
  }
}
