import { Injectable } from '@nestjs/common';
import { toCursorPage } from '@crossmart/common';
import { toProductSummary } from '../../catalog/mappers/product-view.mapper.js';
import type { SelectionPreview, SelectionPreviewQuery } from '../entities/selection-preview.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { ProductStoreDisplays } from './product-store-displays.js';
import {
  addedManuallyWhere,
  removedManuallyWhere,
  selectionFilterWhere,
  type SelectionScope,
  selectionWhere,
} from '../rules/selection-where.js';

/**
 * Evaluates a connection's product selection: products added by hand or imported, plus the
 * automatic rule's matches (search, status, gap, tags, vendor), minus those removed by hand.
 */
@Injectable()
export class ProductSelectionService {
  constructor(
    private readonly products: ProductSelectionRepository,
    private readonly storeDisplays: ProductStoreDisplays,
  ) {}

  async preview(scope: SelectionScope, query: SelectionPreviewQuery): Promise<SelectionPreview> {
    const where = selectionWhere(scope);
    const [total, matchingFilter, addedManually, removedManually, records] = await Promise.all([
      this.products.count(where),
      this.products.count(selectionFilterWhere(scope)),
      this.products.count(addedManuallyWhere(scope)),
      this.products.count(removedManuallyWhere(scope)),
      this.products.listPage(where, query.limit, query.cursor),
    ]);
    const { rows, nextCursor } = toCursorPage(records, query.limit);
    return {
      total,
      matchingFilter,
      addedManually,
      removedManually,
      items: await this.storeDisplays.display(
        scope.workspaceId,
        rows.map((record) => toProductSummary(record)),
      ),
      nextCursor,
    };
  }

  includes(scope: SelectionScope, productId: string): Promise<boolean> {
    return this.products.matches(selectionWhere(scope), productId);
  }

  /** Every selected product id, in batches, so a large catalog is never loaded at once. */
  async *selectedIds(scope: SelectionScope): AsyncGenerator<string[]> {
    const where = selectionWhere(scope);
    let afterId: string | undefined;
    for (;;) {
      const ids = await this.products.listIds(where, SELECTION_BATCH_SIZE, afterId);
      if (ids.length > 0) yield ids;
      if (ids.length < SELECTION_BATCH_SIZE) return;
      afterId = ids.at(-1);
    }
  }

  /** The first selected product in title order, for examples such as the pricing preview. */
  async firstSelectedId(scope: SelectionScope): Promise<string | null> {
    const [first] = await this.products.listPage(selectionWhere(scope), 1);
    return first?.id ?? null;
  }
}
