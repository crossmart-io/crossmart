import { Injectable } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
import type { ActivityPage, ActivityQuery } from '../entities/activity-event-view.js';
import { toActivityEventView } from '../mappers/activity-event.mapper.js';
import { ActivityEventRepository } from '../repositories/activity-event.repository.js';

/** Reads the activity log of a workspace, newest first. */
@Injectable()
export class ActivityService {
  constructor(private readonly events: ActivityEventRepository) {}

  async list(workspaceId: string, query: ActivityQuery): Promise<ActivityPage> {
    const { rows, nextCursor, total } = toCountedPage(
      await this.events.listPage(workspaceId, query),
      query.limit,
    );
    return {
      items: rows.flatMap((record) => toActivityEventView(record) ?? []),
      nextCursor,
      total,
    };
  }

  /**
   * A product's history, including its deletion and the bulk actions and imports that touched
   * it, whatever their subject. Ids are UUIDs, so they never match a record of another type.
   */
  listForProduct(
    workspaceId: string,
    productId: string,
    query: ActivityQuery,
  ): Promise<ActivityPage> {
    return this.list(workspaceId, { ...query, subjectId: productId });
  }
}
