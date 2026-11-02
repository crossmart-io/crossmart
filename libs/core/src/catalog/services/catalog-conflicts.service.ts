import { Injectable } from '@nestjs/common';
import type { ImportIssue } from '../entities/catalog-import.js';
import type { ProductDraft } from '../entities/product-draft.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import { ProductRepository } from '../repositories/product.repository.js';

export interface ConflictCheck {
  accepted: ProductDraft[];
  /** Handles already in the catalog. */
  existing: ImportIssue[];
  /** SKUs already taken, in the catalog or by an earlier product in the same batch. */
  skuConflicts: ImportIssue[];
}

/** Finds drafts that would clash with the catalog: two queries, whatever the batch size. */
@Injectable()
export class CatalogConflictsService {
  constructor(private readonly products: ProductRepository) {}

  /** `exceptProductId` is the product being edited: its own handle and SKUs do not clash. */
  async check(
    workspaceId: string,
    drafts: ProductDraft[],
    exceptProductId?: string,
  ): Promise<ConflictCheck> {
    const [existingHandles, takenSkus] = await Promise.all([
      this.products.findExistingHandles(
        workspaceId,
        drafts.map((draft) => draft.handle),
        exceptProductId,
      ),
      this.products.findExistingSkus(workspaceId, drafts.flatMap(skusOf), exceptProductId),
    ]);
    const result: ConflictCheck = { accepted: [], existing: [], skuConflicts: [] };
    for (const draft of drafts) {
      this.classify(draft, existingHandles, takenSkus, result);
    }
    return result;
  }

  private classify(
    draft: ProductDraft,
    existingHandles: Set<string>,
    takenSkus: Set<string>,
    result: ConflictCheck,
  ): void {
    const { handle } = draft;
    if (existingHandles.has(handle)) {
      result.existing.push({
        code: ImportIssueCode.AlreadyExists,
        message: `A product with handle ${handle} is already in the catalog`,
        handle,
      });
      return;
    }
    const takenSku = skusOf(draft).find((sku) => takenSkus.has(sku));
    if (takenSku) {
      result.skuConflicts.push({
        code: ImportIssueCode.DuplicateSku,
        message: `SKU ${takenSku} is already used by another product`,
        handle,
      });
      return;
    }
    skusOf(draft).forEach((sku) => takenSkus.add(sku));
    existingHandles.add(handle);
    result.accepted.push(draft);
  }
}

function skusOf(draft: ProductDraft): string[] {
  return draft.variants.flatMap((variant) => (variant.sku ? [variant.sku] : []));
}
