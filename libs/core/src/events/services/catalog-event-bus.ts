import { Injectable, Logger } from '@nestjs/common';
import type {
  CatalogChangeListener,
  ProductsChangedEvent,
  StockChangedEvent,
} from '../entities/catalog-events.js';

/**
 * Tells interested modules that catalog data changed, so the catalog and inventory modules
 * need not know who listens (channel sync does). Publishing never throws: a listener that
 * fails is logged and must not undo or fail the catalog write.
 */
@Injectable()
export class CatalogEventBus {
  private readonly logger = new Logger(CatalogEventBus.name);
  private readonly listeners: CatalogChangeListener[] = [];

  subscribe(listener: CatalogChangeListener): void {
    this.listeners.push(listener);
  }

  async productsChanged(event: ProductsChangedEvent): Promise<void> {
    if (event.productIds.length === 0) return;
    await this.notify(event.workspaceId, (listener) => listener.onProductsChanged(event));
  }

  async stockChanged(event: StockChangedEvent): Promise<void> {
    if (event.inventoryItemIds.length === 0) return;
    await this.notify(event.workspaceId, (listener) => listener.onStockChanged(event));
  }

  private async notify(
    workspaceId: string,
    deliver: (listener: CatalogChangeListener) => Promise<void>,
  ): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await deliver(listener);
      } catch (error) {
        const reason = error instanceof Error ? error.name : typeof error;
        this.logger.error(`A catalog listener failed in workspace ${workspaceId}: ${reason}`);
      }
    }
  }
}
