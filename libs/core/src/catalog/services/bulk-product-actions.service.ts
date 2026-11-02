import { Injectable } from '@nestjs/common';
import type { BulkProductChange, BulkProductResult } from '../entities/bulk-product-change.js';
import { BulkProductAction } from '../enums/bulk-product-action.enum.js';
import { ProductBulkWriter } from '../repositories/product-bulk.writer.js';

/** Applies one change to many products of a workspace, in a single statement. */
@Injectable()
export class BulkProductActionsService {
  constructor(private readonly writer: ProductBulkWriter) {}

  async apply(
    workspaceId: string,
    productIds: string[],
    change: BulkProductChange,
  ): Promise<BulkProductResult> {
    const ids = [...new Set(productIds)];
    return { affected: await this.write(workspaceId, ids, change) };
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
