import { Injectable } from '@nestjs/common';
import type { ExternalProduct } from '@crossmart/connectors';
import type { ProductDraft } from '../../../catalog/entities/product-draft.js';
import type { OutcomeIssue } from '../../../catalog/repositories/import-job.repository.js';
import {
  type CreatedProduct,
  ProductRepository,
} from '../../../catalog/repositories/product.repository.js';
import { normalizeDraft } from '../../../catalog/rules/normalize-draft.js';
import { findDraftProblems } from '../../../catalog/rules/product-draft.rules.js';
import { CatalogConflictsService } from '../../../catalog/services/catalog-conflicts.service.js';
import type { StockTarget } from '../../../inventory/entities/stock-levels.js';
import type { ListingRecord } from '../../repositories/listing.repository.js';
import type { ImportPageContext } from '../entities/channel-import.js';
import {
  toImportedStock,
  toListingStatus,
  toProductDraft,
} from '../mappers/external-product.mapper.js';
import { failedIssue } from '../rules/import-issues.js';

/** What creating a page's new products produced, for the page to write and count. */
export interface CreatedProducts {
  created: number;
  /** Products that could not be created; `issues` says why. */
  failed: number;
  productIds: string[];
  listings: ListingRecord[];
  stock: StockTarget[];
  issues: OutcomeIssue[];
}

interface DraftedProduct {
  product: ExternalProduct;
  draft: ProductDraft;
}

/**
 * Creates the catalog products of channel products that match nothing, in one transaction,
 * with a listing that maps every variant and the stock to set. Products that break the
 * catalog's rules or reuse a SKU are reported instead.
 */
@Injectable()
export class ChannelProductCreator {
  constructor(
    private readonly products: ProductRepository,
    private readonly conflicts: CatalogConflictsService,
  ) {}

  async create(context: ImportPageContext, products: ExternalProduct[]): Promise<CreatedProducts> {
    const { valid, issues } = this.validate(products);
    const check = await this.conflicts.check(
      context.workspaceId,
      valid.map(({ draft }) => draft),
    );
    issues.push(...[...check.existing, ...check.skuConflicts].map(failedIssue));
    const productByHandle = new Map(valid.map((entry) => [entry.draft.handle, entry.product]));
    const accepted = check.accepted.flatMap((draft) => {
      const product = productByHandle.get(draft.handle);
      return product ? [{ draft, product }] : [];
    });
    const created = await this.products.createAllWithVariants(
      context.workspaceId,
      accepted.map(({ draft }) => draft),
    );
    const listings = created.map((record, index) =>
      this.toListing(context, accepted[index].product, record),
    );
    return {
      created: created.length,
      failed: products.length - created.length,
      productIds: created.map((record) => record.id),
      listings,
      stock: created.flatMap((record, index) => this.toStock(accepted[index].product, record)),
      issues,
    };
  }

  private validate(products: ExternalProduct[]): {
    valid: DraftedProduct[];
    issues: OutcomeIssue[];
  } {
    const valid: DraftedProduct[] = [];
    const issues: OutcomeIssue[] = [];
    for (const product of products) {
      const draft = normalizeDraft(toProductDraft(product));
      const problems = findDraftProblems(draft);
      if (problems.length === 0) {
        valid.push({ product, draft });
      } else {
        issues.push(
          ...problems.map((problem) => failedIssue({ ...problem, handle: product.handle })),
        );
      }
    }
    return { valid, issues };
  }

  /** Variants are created in the channel's order, so positions line up. */
  private toListing(
    context: ImportPageContext,
    product: ExternalProduct,
    created: CreatedProduct,
  ): ListingRecord {
    return {
      workspaceId: context.workspaceId,
      connectionId: context.connectionId,
      productId: created.id,
      externalId: product.externalId,
      externalUrl: product.externalUrl,
      status: toListingStatus(product),
      syncedAt: context.syncedAt,
      variants: created.variants.map((variant) => ({
        variantId: variant.id,
        externalId: product.variants[variant.position].externalId,
        externalInventoryId: product.variants[variant.position].externalInventoryId,
      })),
    };
  }

  private toStock(product: ExternalProduct, created: CreatedProduct): StockTarget[] {
    return created.variants.flatMap((variant) => {
      const available = toImportedStock(product.variants[variant.position]);
      return variant.inventoryItemId && available !== null && available > 0
        ? [{ inventoryItemId: variant.inventoryItemId, available }]
        : [];
    });
  }
}
