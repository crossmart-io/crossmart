import { ListingSource, ListingStatus, type Prisma } from '@crossmart/database';
import type { ProductSelectionRule } from '../../channels/entities/product-selection.js';
import { toProductListWhere } from '../../catalog/repositories/product-list.filter.js';

/** Matches no product: a connection without an automatic rule adds nothing by itself. */
const NOTHING: Prisma.ProductWhereInput = { id: { in: [] } };

/** Sources of products that stay in the store until they are removed by hand. */
export const KEPT_SOURCES: readonly ListingSource[] = [ListingSource.MANUAL, ListingSource.IMPORT];

/** A connection's product selection: which store it is for, and its automatic rule. */
export interface SelectionScope {
  workspaceId: string;
  connectionId: string;
  rule: ProductSelectionRule | null;
}

/**
 * Products the connection's automatic rule adds: none without a rule or with a null filter,
 * every product with an empty filter, else the filter's matches.
 */
export function selectionFilterWhere({
  workspaceId,
  rule,
}: SelectionScope): Prisma.ProductWhereInput {
  return rule?.filter ? toProductListWhere(workspaceId, rule.filter) : { workspaceId, ...NOTHING };
}

/** Products added to the store by hand or by an import, and not delisted since. */
export function addedToStoreWhere({
  workspaceId,
  connectionId,
  rule,
}: SelectionScope): Prisma.ProductWhereInput {
  return {
    workspaceId,
    OR: [
      {
        listings: {
          some: {
            connectionId,
            source: { in: [...KEPT_SOURCES] },
            status: { not: ListingStatus.DELISTED },
          },
        },
      },
      { id: { in: rule?.includeProductIds ?? [] } },
    ],
  };
}

/**
 * The products the store gets: those added by hand or imported, plus the automatic rule's
 * matches, minus those removed by hand (removal wins).
 */
export function selectionWhere(scope: SelectionScope): Prisma.ProductWhereInput {
  return {
    workspaceId: scope.workspaceId,
    AND: [
      { OR: [addedToStoreWhere(scope), selectionFilterWhere(scope)] },
      { id: { notIn: scope.rule?.excludeProductIds ?? [] } },
    ],
  };
}

/** Products in the store by hand that the automatic rule would not have added. */
export function addedManuallyWhere(scope: SelectionScope): Prisma.ProductWhereInput {
  return {
    AND: [
      addedToStoreWhere(scope),
      { id: { notIn: scope.rule?.excludeProductIds ?? [] } },
      { NOT: selectionFilterWhere(scope) },
    ],
  };
}

/** Products the automatic rule matches that the merchant removed by hand. */
export function removedManuallyWhere(scope: SelectionScope): Prisma.ProductWhereInput {
  return {
    AND: [selectionFilterWhere(scope), { id: { in: scope.rule?.excludeProductIds ?? [] } }],
  };
}
