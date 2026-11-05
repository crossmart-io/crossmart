import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService, SubscriptionStatus } from '@crossmart/database';

const PLAN_VERSION_INCLUDE = {
  planVersion: {
    select: {
      version: true,
      plan: { select: { code: true, name: true } },
      features: { select: { feature: true, enabled: true, limit: true } },
    },
  },
} as const satisfies Prisma.OrganizationSubscriptionInclude;

export type SubscriptionRecord = Prisma.OrganizationSubscriptionGetPayload<{
  include: typeof PLAN_VERSION_INCLUDE;
}>;

/** Organizations' subscriptions, with the plan version and features they are on. */
@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findForOrganization(organizationId: string): Promise<SubscriptionRecord | null> {
    return this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
      include: PLAN_VERSION_INCLUDE,
    });
  }

  /**
   * The latest version of the default plan, which new organizations start on. With several
   * default plans, the first in sort order wins. Null only when no plan is marked default.
   */
  async findDefaultPlanVersionId(): Promise<string | null> {
    const version = await this.prisma.planVersion.findFirst({
      where: { plan: { isDefault: true, active: true } },
      orderBy: [{ plan: { sortOrder: 'asc' } }, { version: 'desc' }],
      select: { id: true },
    });
    return version?.id ?? null;
  }

  /** Puts the organization on a plan version, unless it already has a subscription. */
  subscribe(organizationId: string, planVersionId: string): Promise<SubscriptionRecord> {
    return this.prisma.organizationSubscription.upsert({
      where: { organizationId },
      create: { organizationId, planVersionId, status: SubscriptionStatus.ACTIVE },
      update: {},
      include: PLAN_VERSION_INCLUDE,
    });
  }
}
