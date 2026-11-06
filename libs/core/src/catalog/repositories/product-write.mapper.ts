import { InventoryMovementReason, type Prisma } from '@crossmart/database';
import type { MediaDraft, ProductDraft, VariantDraft } from '../entities/product-draft.js';
import { NO_OPENING_STOCK } from '../catalog.constants.js';

type GeneratedColumns = 'id' | 'createdAt' | 'updatedAt';

/** The product's own columns, valid for both create and update. */
export type ProductFields = Omit<
  Prisma.ProductCreateInput,
  GeneratedColumns | 'workspace' | 'variants' | 'media'
>;

/** The variant's own columns, without its stock. */
export type VariantFields = Omit<
  Prisma.VariantCreateWithoutProductInput,
  GeneratedColumns | 'workspaceId' | 'inventoryItem'
>;

export function toProductFields(draft: ProductDraft): ProductFields {
  return {
    handle: draft.handle,
    title: draft.title,
    descriptionHtml: draft.descriptionHtml,
    vendor: draft.vendor ?? null,
    productType: draft.productType ?? null,
    tags: draft.tags,
    status: draft.status,
    optionNames: draft.optionNames,
  };
}

export function toVariantFields(variant: VariantDraft, position: number): VariantFields {
  return {
    position,
    sku: variant.sku ?? null,
    barcode: variant.barcode ?? null,
    optionValues: variant.optionValues,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? null,
    cost: variant.cost ?? null,
    weightGrams: variant.weightGrams ?? null,
    requiresShipping: variant.requiresShipping,
    taxable: variant.taxable,
    outOfStockPolicy: variant.outOfStockPolicy,
  };
}

/** A new variant with its stock item and, when it has stock, the opening ledger entry. */
export function toNewVariantInput(
  workspaceId: string,
  variant: VariantDraft,
  position: number,
): Prisma.VariantCreateWithoutProductInput {
  const { tracked, quantity = NO_OPENING_STOCK } = variant.inventory;
  return {
    ...toVariantFields(variant, position),
    workspaceId,
    inventoryItem: {
      create: {
        workspaceId,
        tracked,
        available: quantity,
        movements:
          quantity === 0
            ? undefined
            : {
                create: {
                  workspaceId,
                  delta: quantity,
                  quantityAfter: quantity,
                  reason: InventoryMovementReason.OPENING_BALANCE,
                },
              },
      },
    },
  };
}

export function toMediaInputs(
  workspaceId: string,
  media: MediaDraft[],
): Prisma.ProductMediaCreateWithoutProductInput[] {
  return media.map(({ url, altText }, position) => ({ workspaceId, url, altText, position }));
}

export function toProductCreateInput(
  workspaceId: string,
  draft: ProductDraft,
): Prisma.ProductCreateInput {
  return {
    ...toProductFields(draft),
    workspace: { connect: { id: workspaceId } },
    variants: {
      create: draft.variants.map((variant, position) =>
        toNewVariantInput(workspaceId, variant, position),
      ),
    },
    media: { create: toMediaInputs(workspaceId, draft.media) },
  };
}
