import { Injectable } from '@nestjs/common';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { BulkProductChange, BulkProductResult } from '../entities/bulk-product-change.js';
import { BulkProductAction } from '../enums/bulk-product-action.enum.js';
import { ProductBulkWriter } from '../repositories/product-bulk.writer.js';

const TAG_SEPARATOR = ', ';

/** Applies one change to many products of a workspace, in a single statement. */
@Injectable()
export class BulkProductActionsService {
  constructor(
    private readonly writer: ProductBulkWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  async apply(
    workspaceId: string,
    productIds: string[],
    change: BulkProductChange,
    actor: Actor,
  ): Promise<BulkProductResult> {
    const ids = [...new Set(productIds)];
    const affected = await this.write(workspaceId, ids, change);
    if (affected > 0) {
      await this.activity.record(workspaceId, actor, toActivityEntry(ids, change, affected));
    }
    return { affected };
  }

  private write(workspaceId: string, ids: string[], change: BulkProductChange): Promise<number> {
    switch (change.action) {
      case BulkProductAction.SetStatus:
        return this.writer.setStatus(workspaceId, ids, change.status);
      case BulkProductAction.AddTags:
        return this.writer.addTags(workspaceId, ids, normalizeTags(change.tags));
      case BulkProductAction.RemoveTags:
        return this.writer.removeTags(workspaceId, ids, normalizeTags(change.tags));
      case BulkProductAction.AdjustPrices:
        return this.writer.adjustPrices(workspaceId, ids, change.percent);
      case BulkProductAction.Delete:
        return this.writer.delete(workspaceId, ids);
    }
  }
}

/** Trimmed, non-empty and unique ignoring case, as the product editor stores tags. */
function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function toActivityEntry(
  ids: string[],
  change: BulkProductChange,
  affected: number,
): ActivityEntry {
  const isDelete = change.action === BulkProductAction.Delete;
  return {
    action: isDelete ? ActivityAction.ProductsBulkDeleted : ActivityAction.ProductsBulkUpdated,
    subject: { type: ActivitySubjectType.Product },
    relatedSubjectIds: ids,
    itemCount: affected,
    detail: describeChange(change),
  };
}

/** The change in words, for the summary. Deleting needs none. */
function describeChange(change: BulkProductChange): string | undefined {
  switch (change.action) {
    case BulkProductAction.SetStatus:
      return `status set to ${change.status.toLowerCase()}`;
    case BulkProductAction.AddTags:
      return `added tags ${normalizeTags(change.tags).join(TAG_SEPARATOR)}`;
    case BulkProductAction.RemoveTags:
      return `removed tags ${normalizeTags(change.tags).join(TAG_SEPARATOR)}`;
    case BulkProductAction.AdjustPrices:
      return `prices ${change.percent > 0 ? '+' : ''}${change.percent}%`;
    case BulkProductAction.Delete:
      return undefined;
  }
}
