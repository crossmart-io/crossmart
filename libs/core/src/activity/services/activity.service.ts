import { Injectable } from '@nestjs/common';
import type { ActivityPage, ActivityQuery } from '../entities/activity-event-view.js';
import { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';
import { toActivityEventView } from '../mappers/activity-event.mapper.js';
import { ActivityEventRepository } from '../repositories/activity-event.repository.js';

/** Reads the activity log of a workspace, newest first. */
@Injectable()
export class ActivityService {
  constructor(private readonly events: ActivityEventRepository) {}

  async list(workspaceId: string, query: ActivityQuery): Promise<ActivityPage> {
    const records = await this.events.listPage(workspaceId, query);
    const hasMore = records.length > query.limit;
    const page = hasMore ? records.slice(0, query.limit) : records;
    return {
      items: page.flatMap((record) => toActivityEventView(record) ?? []),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  /** A product's history, including bulk actions that touched it and its deletion. */
  listForProduct(
    workspaceId: string,
    productId: string,
    query: ActivityQuery,
  ): Promise<ActivityPage> {
    return this.list(workspaceId, {
      ...query,
      subjectType: ActivitySubjectType.Product,
      subjectId: productId,
    });
  }
}
