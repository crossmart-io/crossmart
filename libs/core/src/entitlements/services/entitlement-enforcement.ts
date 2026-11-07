import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type { SubscriptionAccessTerms } from '../entities/subscription-access.js';

/**
 * Whether plan limits block actions, from `ENTITLEMENTS_ENFORCED`. Off by default until billing
 * lets merchants upgrade; usage and limits are computed and reported either way.
 */
@Injectable()
export class EntitlementEnforcement {
  constructor(private readonly appConfig: AppConfigService) {}

  get enforced(): boolean {
    return this.appConfig.entitlementsEnforced;
  }

  /** Whether this instance bills its customers (ADR 0024); false when self-hosting. */
  get billingEnabled(): boolean {
    return this.appConfig.billingEnabled;
  }

  /**
   * Whether an organization without a paying subscription is read-only: only where billing is
   * on and limits are enforced, so self-hosting and a billing soft launch never lock anyone out.
   */
  get subscriptionsEnforced(): boolean {
    return this.billingEnabled && this.enforced;
  }

  /** The grace period and legacy access this instance gives (ADR 0024). */
  get subscriptionTerms(): SubscriptionAccessTerms {
    const { pastDueGraceDays, legacyAccessUntil } = this.appConfig.billingSettings;
    return { pastDueGraceDays, legacyAccessUntil };
  }
}
