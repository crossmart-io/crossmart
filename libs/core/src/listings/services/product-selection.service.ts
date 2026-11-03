import { Injectable } from '@nestjs/common';
import { toCursorPage } from '@crossmart/common';
import type { ProductSelectionRule } from '../../channels/entities/product-selection.js';
import { toProductSummary } from '../../catalog/mappers/product-view.mapper.js';
import type { SelectionPreview, SelectionPreviewQuery } from '../entities/selection-preview.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import {
  addedManuallyWhere,
  removedManuallyWhere,
  selectionFilterWhere,
  selectionWhere,
} from '../rules/selection-where.js';

/**
 * Evaluates a connection's product selection: the catalog filters (search, status, gap, tags,
 * vendor) plus hand-picked and hand-removed products. A null rule selects every product.
 */
@Injectable()
export class ProductSelectionService {
  constructor(private readonly products: ProductSelectionRepository) {}

  async preview(
    workspaceId: string,
    rule: ProductSelectionRule | null,
    query: SelectionPreviewQuery,
  ): Promise<SelectionPreview> {
    const where = selectionWhere(workspaceId, rule);
    const [total, matchingFilter, addedManually, removedManually, records] = await Promise.all([
      this.products.count(where),
      this.products.count(selectionFilterWhere(workspaceId, rule)),
      rule ? this.products.count(addedManuallyWhere(workspaceId, rule)) : Promise.resolve(0),
      rule ? this.products.count(removedManuallyWhere(workspaceId, rule)) : Promise.resolve(0),
      this.products.listPage(where, query.limit, query.cursor),
    ]);
    const { rows, nextCursor } = toCursorPage(records, query.limit);
    return {
      total,
      matchingFilter,
      addedManually,
      removedManually,
      items: rows.map((record) => toProductSummary(record)),
      nextCursor,
    };
  }

  includes(
    workspaceId: string,
    rule: ProductSelectionRule | null,
    productId: string,
  ): Promise<boolean> {
    return this.products.matches(selectionWhere(workspaceId, rule), productId);
  }

  /** Every selected product id, in batches, so a large catalog is never loaded at once. */
  async *selectedIds(
    workspaceId: string,
    rule: ProductSelectionRule | null,
  ): AsyncGenerator<string[]> {
    const where = selectionWhere(workspaceId, rule);
    let afterId: string | undefined;
    for (;;) {
      const ids = await this.products.listIds(where, SELECTION_BATCH_SIZE, afterId);
      if (ids.length > 0) yield ids;
      if (ids.length < SELECTION_BATCH_SIZE) return;
      afterId = ids.at(-1);
    }
  }

  /** The first selected product in title order, for examples such as the pricing preview. */
  async firstSelectedId(
    workspaceId: string,
    rule: ProductSelectionRule | null,
  ): Promise<string | null> {
    const [first] = await this.products.listPage(selectionWhere(workspaceId, rule), 1);
    return first?.id ?? null;
  }
}
