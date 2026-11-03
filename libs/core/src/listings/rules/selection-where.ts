import type { Prisma } from '@crossmart/database';
import type { ProductSelectionRule } from '../../channels/entities/product-selection.js';
import { toProductListWhere } from '../../catalog/repositories/product-list.filter.js';

/** Matches no product: the filter of a selection made only of hand-picked products. */
const NOTHING: Prisma.ProductWhereInput = { id: { in: [] } };

/** The products a selection's filter matches, before its manual lists. */
export function selectionFilterWhere(
  workspaceId: string,
  rule: ProductSelectionRule | null,
): Prisma.ProductWhereInput {
  if (!rule) return { workspaceId };
  return rule.filter ? toProductListWhere(workspaceId, rule.filter) : { workspaceId, ...NOTHING };
}

/**
 * The products a selection lists: the filter's matches plus the included ids, minus the
 * excluded ids (exclusion wins). No rule lists every product of the workspace.
 */
export function selectionWhere(
  workspaceId: string,
  rule: ProductSelectionRule | null,
): Prisma.ProductWhereInput {
  if (!rule) return { workspaceId };
  return {
    workspaceId,
    AND: [
      { OR: [selectionFilterWhere(workspaceId, rule), { id: { in: rule.includeProductIds } }] },
      { id: { notIn: rule.excludeProductIds } },
    ],
  };
}

/** Included products the filter would not have selected. */
export function addedManuallyWhere(
  workspaceId: string,
  rule: ProductSelectionRule,
): Prisma.ProductWhereInput {
  return {
    workspaceId,
    id: { in: rule.includeProductIds, notIn: rule.excludeProductIds },
    NOT: selectionFilterWhere(workspaceId, rule),
  };
}

/** Products the filter matches that the merchant removed by hand. */
export function removedManuallyWhere(
  workspaceId: string,
  rule: ProductSelectionRule,
): Prisma.ProductWhereInput {
  return {
    AND: [selectionFilterWhere(workspaceId, rule), { id: { in: rule.excludeProductIds } }],
  };
}
