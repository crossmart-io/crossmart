import { Injectable } from '@nestjs/common';
import { InventoryMovementReason, type Prisma, PrismaService } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { toMovementActor } from '../../inventory/mappers/movement-actor.mapper.js';
import type { ProductDraft, VariantDraft } from '../entities/product-draft.js';
import {
  toMediaInputs,
  toNewVariantInput,
  toProductFields,
  toVariantFields,
} from './product-write.mapper.js';

type Transaction = Prisma.TransactionClient;

interface CurrentStock {
  inventoryItemId: string;
  available: number;
  reserved: number;
}

interface VariantEdit {
  variantId: string;
  variant: VariantDraft;
  position: number;
  current: CurrentStock;
}

/**
 * Replaces a product's content, variants and media in one transaction. Variants keep their
 * ids (and their listings, later) when edited; stock changes become ledger adjustments.
 * The editor's quantity is the available stock: reserved units stay reserved. Ledger entries
 * are credited to the editor, like manual adjustments.
 */
@Injectable()
export class ProductUpdateWriter {
  constructor(private readonly prisma: PrismaService) {}

  async update(
    workspaceId: string,
    productId: string,
    draft: ProductDraft,
    actor: Actor,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const stock = await this.readCurrentStock(tx, productId);
      await this.removeDroppedVariants(tx, productId, draft.variants);
      for (const [position, variant] of draft.variants.entries()) {
        const current = variant.id ? stock.get(variant.id) : undefined;
        if (variant.id && current) {
          await this.updateVariant(tx, workspaceId, actor, {
            variantId: variant.id,
            variant,
            position,
            current,
          });
        } else {
          await tx.variant.create({
            data: {
              ...toNewVariantInput(workspaceId, variant, position),
              product: { connect: { id: productId } },
            },
          });
        }
      }
      await this.replaceMedia(tx, workspaceId, productId, draft);
      await tx.product.update({ where: { id: productId }, data: toProductFields(draft) });
    });
  }

  private async readCurrentStock(
    tx: Transaction,
    productId: string,
  ): Promise<Map<string, CurrentStock>> {
    const items = await tx.inventoryItem.findMany({
      where: { variant: { productId } },
      select: { id: true, variantId: true, available: true, reserved: true },
    });
    return new Map(
      items.map((item) => [
        item.variantId,
        { inventoryItemId: item.id, available: item.available, reserved: item.reserved },
      ]),
    );
  }

  private async removeDroppedVariants(
    tx: Transaction,
    productId: string,
    variants: VariantDraft[],
  ): Promise<void> {
    const keptIds = variants.flatMap((variant) => (variant.id ? [variant.id] : []));
    await tx.variant.deleteMany({ where: { productId, id: { notIn: keptIds } } });
  }

  private async updateVariant(
    tx: Transaction,
    workspaceId: string,
    actor: Actor,
    { variantId, variant, position, current }: VariantEdit,
  ): Promise<void> {
    await tx.variant.update({ where: { id: variantId }, data: toVariantFields(variant, position) });
    const delta = variant.inventory.quantity - current.available;
    await tx.inventoryItem.update({
      where: { id: current.inventoryItemId },
      data: { tracked: variant.inventory.tracked, available: { increment: delta } },
    });
    if (delta !== 0) {
      await tx.inventoryMovement.create({
        data: {
          workspaceId,
          inventoryItemId: current.inventoryItemId,
          delta,
          quantityAfter: variant.inventory.quantity + current.reserved,
          reason: InventoryMovementReason.ADJUSTMENT,
          ...toMovementActor(actor),
        },
      });
    }
  }

  private async replaceMedia(
    tx: Transaction,
    workspaceId: string,
    productId: string,
    draft: ProductDraft,
  ): Promise<void> {
    await tx.productMedia.deleteMany({ where: { productId } });
    await tx.productMedia.createMany({
      data: toMediaInputs(workspaceId, draft.media).map((media) => ({ ...media, productId })),
    });
  }
}
