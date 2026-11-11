import { Injectable } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import { ProductsService } from '../../catalog/services/products.service.js';
import type { ProductSale } from '../entities/product-sale.js';
import { SoldProductStores } from './sold-product.stores.js';
import { SoldStockClearer } from './sold-stock.clearer.js';

/**
 * Marks a product sold wherever it sold (in person, or on a store Crossmart does not manage), as
 * resellers do with one-of-a-kind items: every tracked variant's available stock goes to 0, and
 * the product is taken off every store through the same path as removing it by hand, which ends
 * the listing on the channel or clears one the channel never received. Doing it again changes
 * nothing.
 */
@Injectable()
export class ProductSaleService {
  constructor(
    private readonly products: ProductsService,
    private readonly stock: SoldStockClearer,
    private readonly stores: SoldProductStores,
    private readonly activity: ActivityRecorder,
  ) {}

  async markSold(workspaceId: string, productId: string, actor: Actor): Promise<ProductSale> {
    const before = await this.products.get(workspaceId, productId);
    const unitsCleared = await this.stock.clear(workspaceId, productId, actor);
    const removed = await this.stores.takeOff(workspaceId, productId, actor);
    const alreadySold = unitsCleared === 0 && removed.length === 0;
    if (!alreadySold) await this.record(workspaceId, actor, before, unitsCleared);
    return {
      product: alreadySold ? before : await this.products.get(workspaceId, productId),
      unitsCleared,
      removedFromStores: removed.map(({ id, channel, displayName }) => ({
        connectionId: id,
        channel,
        displayName,
      })),
      alreadySold,
    };
  }

  /** One event for the sale; each store it left logs its own removal. */
  private record(
    workspaceId: string,
    actor: Actor,
    product: ProductDetail,
    unitsCleared: number,
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action: ActivityAction.ProductMarkedSold,
      subject: { type: ActivitySubjectType.Product, id: product.id, label: product.title },
      itemCount: unitsCleared,
    });
  }
}
