import {
  type CountedRecords,
  toPageWindow,
  SortDirection,
  sortWithTiebreak,
} from '@crossmart/common';
import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { ActivityQuery } from '../entities/activity-event-view.js';
import { ACTIVITY_EVENT_INCLUDE, type ActivityEventRecord } from './activity-event.queries.js';

@Injectable()
export class ActivityEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: Prisma.ActivityEventUncheckedCreateInput): Promise<void> {
    await this.prisma.activityEvent.create({ data: input, select: { id: true } });
  }

  /** One page, newest first, plus one extra row that tells the caller whether more exist. */
  async listPage(
    workspaceId: string,
    query: ActivityQuery,
  ): Promise<CountedRecords<ActivityEventRecord>> {
    const where: Prisma.ActivityEventWhereInput = this.toFilter(workspaceId, query);
    const [records, total] = await this.prisma.$transaction([
      this.prisma.activityEvent.findMany({
        where,
        include: ACTIVITY_EVENT_INCLUDE,
        orderBy: sortWithTiebreak('createdAt', query.direction ?? SortDirection.Desc),
        ...toPageWindow(query),
      }),
      this.prisma.activityEvent.count({ where }),
    ]);
    return { records, total };
  }

  private toFilter(workspaceId: string, query: ActivityQuery): Prisma.ActivityEventWhereInput {
    return {
      workspaceId,
      action: query.action,
      outcome: query.outcome,
      subjectType: query.subjectType,
      actorUserId: query.actorUserId,
      actorApiKeyId: query.actorApiKeyId,
      ...(query.subjectId ? { subjectIds: { has: query.subjectId } } : {}),
    };
  }
}
