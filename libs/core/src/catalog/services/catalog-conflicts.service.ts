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

/** A file's product that will replace the catalog product `productId`. */
export interface ProductReplacement {
  productId: string;
  draft: ProductDraft;
}

export interface ReplacementCheck {
  accepted: ProductReplacement[];
  /** SKUs held by another product, in the catalog or earlier in the same batch. */
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

  /** SKU clashes of products that replace existing ones: one query, whatever the batch size. */
  async checkReplacements(
    workspaceId: string,
    replacements: ProductReplacement[],
  ): Promise<ReplacementCheck> {
    const owners = await this.products.findSkuOwners(
      workspaceId,
      replacements.flatMap(({ draft }) => skusOf(draft)),
    );
    const result: ReplacementCheck = { accepted: [], skuConflicts: [] };
    for (const replacement of replacements) {
      const { productId, draft } = replacement;
      const takenSku = skusOf(draft).find((sku) => (owners.get(sku) ?? productId) !== productId);
      if (takenSku) {
        result.skuConflicts.push(skuConflict(draft.handle, takenSku));
        continue;
      }
      skusOf(draft).forEach((sku) => owners.set(sku, productId));
      result.accepted.push(replacement);
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
      result.skuConflicts.push(skuConflict(handle, takenSku));
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

function skuConflict(handle: string, sku: string): ImportIssue {
  return {
    code: ImportIssueCode.DuplicateSku,
    message: `SKU ${sku} is already used by another product`,
    handle,
    sku,
  };
}
