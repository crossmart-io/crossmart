import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';

const OFFERED_PLAN_SELECT = {
  code: true,
  name: true,
  versions: {
    orderBy: { version: 'desc' },
    take: 1,
    select: {
      version: true,
      features: { select: { feature: true, enabled: true, limit: true } },
    },
  },
} as const satisfies Prisma.PlanSelect;

export type OfferedPlanRecord = Prisma.PlanGetPayload<{ select: typeof OFFERED_PLAN_SELECT }>;

/** The plans on offer, as seeded by the plan lineup migrations. Holds no organization data. */
@Injectable()
export class PlanCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Active plans in their sort order, each with its latest version's features, in one query. */
  findOffered(): Promise<OfferedPlanRecord[]> {
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: OFFERED_PLAN_SELECT,
    });
  }
}
