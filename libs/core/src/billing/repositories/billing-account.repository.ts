import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { ProviderReference, SubscriptionUpdate } from '../entities/subscription-update.js';

const BILLING_ACCOUNT_SELECT = {
  organizationId: true,
  status: true,
  externalCustomerId: true,
  externalSubscriptionId: true,
  billingInterval: true,
  currentPeriodEnd: true,
  trialEnd: true,
  cancelAtPeriodEnd: true,
  pastDueSince: true,
  planVersionId: true,
  planVersion: { select: { plan: { select: { code: true } } } },
  organization: { select: { name: true } },
} as const satisfies Prisma.OrganizationSubscriptionSelect;

/** An organization's subscription row with what billing reads of it. */
export type BillingAccountRecord = Prisma.OrganizationSubscriptionGetPayload<{
  select: typeof BILLING_ACCOUNT_SELECT;
}>;

/**
 * The billing side of organizations' subscriptions: provider ids, status and period, and the plan
 * version a paid subscription puts the organization on. One row per organization.
 */
@Injectable()
export class BillingAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOrganization(organizationId: string): Promise<BillingAccountRecord | null> {
    return this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
      select: BILLING_ACCOUNT_SELECT,
    });
  }

  /** The organization a provider subscription or customer belongs to; both ids are unique. */
  async findOrganizationId({
    subscriptionId,
    customerId,
  }: ProviderReference): Promise<string | null> {
    const or: Prisma.OrganizationSubscriptionWhereInput[] = [
      ...(subscriptionId ? [{ externalSubscriptionId: subscriptionId }] : []),
      ...(customerId ? [{ externalCustomerId: customerId }] : []),
    ];
    if (or.length === 0) return null;
    const row = await this.prisma.organizationSubscription.findFirst({
      where: { OR: or },
      select: { organizationId: true },
    });
    return row?.organizationId ?? null;
  }

  /**
   * Records the organization's provider customer unless it has one, and returns the one it has.
   * Two checkouts at once cannot leave the organization with two customers.
   */
  async saveCustomerId(organizationId: string, customerId: string): Promise<string> {
    await this.prisma.organizationSubscription.updateMany({
      where: { organizationId, externalCustomerId: null },
      data: { externalCustomerId: customerId },
    });
    const row = await this.prisma.organizationSubscription.findUniqueOrThrow({
      where: { organizationId },
      select: { externalCustomerId: true },
    });
    return row.externalCustomerId ?? customerId;
  }

  /** The latest version of an offered or legacy plan, by its code; null for an unknown code. */
  async findLatestPlanVersionId(planCode: string): Promise<string | null> {
    const version = await this.prisma.planVersion.findFirst({
      where: { plan: { code: planCode } },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    return version?.id ?? null;
  }

  async applySubscription(organizationId: string, update: SubscriptionUpdate): Promise<void> {
    await this.prisma.organizationSubscription.update({ where: { organizationId }, data: update });
  }
}
