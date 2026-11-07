import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@crossmart/database';
import type { SubscriptionAccess, SubscriptionStanding } from '../entities/subscription-access.js';
import { SubscriptionInactiveException } from '../errors/subscription-inactive.exception.js';
import { SandboxStatusRepository } from '../repositories/sandbox-status.repository.js';
import {
  type StandingRecord,
  SubscriptionRepository,
} from '../repositories/subscription.repository.js';
import { UsageRepository } from '../repositories/usage.repository.js';
import {
  SANDBOX_ACCESS,
  subscriptionAccess,
  UNRESTRICTED_ACCESS,
} from '../rules/subscription-access.js';
import { EntitlementEnforcement } from './entitlement-enforcement.js';

/** No row yet reads as an organization from before billing, which keeps full access. */
const LEGACY_STANDING: SubscriptionStanding = {
  status: SubscriptionStatus.ACTIVE,
  subscribed: false,
  trialEnd: null,
  pastDueSince: null,
  cancelAt: null,
};

function toStanding(record: StandingRecord | null): SubscriptionStanding {
  if (!record) return LEGACY_STANDING;
  const { status, trialEnd, pastDueSince, cancelAt } = record;
  const subscribed = record.externalSubscriptionId !== null;
  return { status, subscribed, trialEnd, pastDueSince, cancelAt };
}

/**
 * Whether an organization's subscription lets it change anything (ADR 0024). Reads always work;
 * writes, publishing and syncing are refused while it is read-only, and only where billing is on
 * and `ENTITLEMENTS_ENFORCED` is too. Unclaimed sandboxes are left to the sandbox rules.
 */
@Injectable()
export class SubscriptionAccessPolicy {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly sandboxes: SandboxStatusRepository,
    private readonly usage: UsageRepository,
    private readonly enforcement: EntitlementEnforcement,
  ) {}

  /** Whether read-only organizations are refused writes: billing and enforcement are both on. */
  get enforced(): boolean {
    return this.enforcement.subscriptionsEnforced;
  }

  /** The organization's standing; `Unrestricted` where billing is off. */
  async access(organizationId: string): Promise<SubscriptionAccess> {
    if (!this.enforcement.billingEnabled) return UNRESTRICTED_ACCESS;
    const record = await this.subscriptions.findStanding(organizationId);
    const terms = this.enforcement.subscriptionTerms;
    const access = subscriptionAccess(toStanding(record), terms, new Date());
    if (access.writable) return access;
    const sandbox = await this.sandboxes.findUnclaimed({ organizationId });
    return sandbox ? SANDBOX_ACCESS : access;
  }

  /** `access` for the organization a workspace belongs to. */
  async accessInWorkspace(workspaceId: string): Promise<SubscriptionAccess> {
    return this.access(await this.usage.organizationIdOf(workspaceId));
  }

  /** Throws `SubscriptionInactiveException` (402) when enforced and the organization is read-only. */
  async assertWritable(organizationId: string): Promise<void> {
    if (!this.enforced) return;
    const access = await this.access(organizationId);
    if (!access.writable) throw new SubscriptionInactiveException(access);
  }

  /** `assertWritable` for the organization a workspace belongs to. */
  async assertWritableInWorkspace(workspaceId: string): Promise<void> {
    if (!this.enforced) return;
    await this.assertWritable(await this.usage.organizationIdOf(workspaceId));
  }
}
