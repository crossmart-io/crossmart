import { Injectable } from '@nestjs/common';
import { InventoryMovementReason, type Prisma, PrismaService } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { LockedStock } from '../../inventory/entities/inventory-ledger.js';
import { InventoryLedger } from '../../inventory/repositories/inventory-ledger.js';
import type { ProductDraft, VariantDraft } from '../entities/product-draft.js';
import {
  toMediaInputs,
  toNewVariantInput,
  toProductFields,
  toVariantFields,
} from './product-write.mapper.js';

type Transaction = Prisma.TransactionClient;

/** The product being edited, and who edits it. */
interface ProductEdit {
  workspaceId: string;
  productId: string;
  actor: Actor;
}

interface VariantEdit {
  variant: VariantDraft;
  position: number;
  stock: LockedStock;
}

/**
 * Replaces a product's content, variants and media in one transaction. Variants keep their
 * ids (and their listings, later) when edited; stock changes go through the inventory ledger
 * against the locked stock. The editor's quantity is the available stock: reserved units stay
 * reserved. Ledger entries are credited to the editor, like manual adjustments.
 */
@Injectable()
export class ProductUpdateWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: InventoryLedger,
  ) {}

  async update(
    workspaceId: string,
    productId: string,
    draft: ProductDraft,
    actor: Actor,
  ): Promise<void> {
    const edit: ProductEdit = { workspaceId, productId, actor };
    await this.prisma.$transaction(async (tx) => {
      const stock = await this.lockStock(tx, edit);
      await this.removeDroppedVariants(tx, edit, draft.variants);
      for (const [position, variant] of draft.variants.entries()) {
        const current = variant.id ? stock.get(variant.id) : undefined;
        if (current) {
          await this.updateVariant(tx, edit, { variant, position, stock: current });
        } else {
          await this.createVariant(tx, edit, variant, position);
        }
      }
      await this.replaceMedia(tx, workspaceId, productId, draft);
      await tx.product.updateMany({
        where: { id: productId, workspaceId },
        data: toProductFields(draft),
      });
    });
  }

  /** Locks the stock of the product's variants, so a concurrent order or adjustment waits. */
  private async lockStock(tx: Transaction, edit: ProductEdit): Promise<Map<string, LockedStock>> {
    const items = await tx.inventoryItem.findMany({
      where: { workspaceId: edit.workspaceId, variant: { productId: edit.productId } },
      select: { id: true },
    });
    const ids = items.map((item) => item.id);
    const locked = await this.ledger.lockItems(tx, edit.workspaceId, ids);
    return new Map(locked.map((stock) => [stock.variantId, stock]));
  }

  private async removeDroppedVariants(
    tx: Transaction,
    { workspaceId, productId }: ProductEdit,
    variants: VariantDraft[],
  ): Promise<void> {
    const keptIds = variants.flatMap((variant) => (variant.id ? [variant.id] : []));
    await tx.variant.deleteMany({ where: { workspaceId, productId, id: { notIn: keptIds } } });
  }

  private async createVariant(
    tx: Transaction,
    { workspaceId, productId }: ProductEdit,
    variant: VariantDraft,
    position: number,
  ): Promise<void> {
    await tx.variant.create({
      data: {
        ...toNewVariantInput(workspaceId, variant, position),
        product: { connect: { id: productId } },
      },
    });
  }

  private async updateVariant(
    tx: Transaction,
    { workspaceId, productId, actor }: ProductEdit,
    { variant, position, stock }: VariantEdit,
  ): Promise<void> {
    await tx.variant.updateMany({
      where: { id: stock.variantId, workspaceId, productId },
      data: toVariantFields(variant, position),
    });
    await tx.inventoryItem.updateMany({
      where: { id: stock.id, workspaceId },
      data: { tracked: variant.inventory.tracked },
    });
    await this.ledger.applyMovement(tx, workspaceId, {
      stock,
      availableDelta: (variant.inventory.quantity ?? stock.available) - stock.available,
      reservedDelta: 0,
      entry: { reason: InventoryMovementReason.ADJUSTMENT, actor },
    });
  }

  private async replaceMedia(
    tx: Transaction,
    workspaceId: string,
    productId: string,
    draft: ProductDraft,
  ): Promise<void> {
    await tx.productMedia.deleteMany({ where: { productId, workspaceId } });
    await tx.productMedia.createMany({
      data: toMediaInputs(workspaceId, draft.media).map((media) => ({ ...media, productId })),
    });
  }
}
