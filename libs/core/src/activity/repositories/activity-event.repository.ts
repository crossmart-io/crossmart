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
  listPage(workspaceId: string, query: ActivityQuery): Promise<ActivityEventRecord[]> {
    return this.prisma.activityEvent.findMany({
      where: this.toFilter(workspaceId, query),
      include: ACTIVITY_EVENT_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
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
