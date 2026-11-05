import { describeError } from '@crossmart/common';
import { Injectable, Logger } from '@nestjs/common';
import type {
  CatalogChangeListener,
  ProductsChangedEvent,
  ProductsDeletingEvent,
  StockChangedEvent,
} from '../entities/catalog-events.js';
import {
  PRODUCTS_CHANGED_EVENT,
  PRODUCTS_DELETING_EVENT,
  STOCK_CHANGED_EVENT,
} from '../events.constants.js';

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
    await this.notify(
      {
        workspaceId: event.workspaceId,
        name: `${PRODUCTS_CHANGED_EVENT} (${event.productIds.length})`,
      },
      (listener) => listener.onProductsChanged(event),
    );
  }

  async stockChanged(event: StockChangedEvent): Promise<void> {
    if (event.inventoryItemIds.length === 0) return;
    await this.notify(
      {
        workspaceId: event.workspaceId,
        name: `${STOCK_CHANGED_EVENT} (${event.inventoryItemIds.length})`,
      },
      (listener) => listener.onStockChanged(event),
    );
  }

  /** Called before the products are deleted; a failing listener does not stop the delete. */
  async productsDeleting(event: ProductsDeletingEvent): Promise<void> {
    if (event.productIds.length === 0) return;
    await this.notify(
      {
        workspaceId: event.workspaceId,
        name: `${PRODUCTS_DELETING_EVENT} (${event.productIds.length})`,
      },
      (listener) => listener.onProductsDeleting(event),
    );
  }

  /** The event is named in the log with its size, so a dropped change can be traced. */
  private async notify(
    event: { workspaceId: string; name: string },
    deliver: (listener: CatalogChangeListener) => Promise<void>,
  ): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await deliver(listener);
      } catch (error) {
        this.logger.error(
          `A catalog listener failed on ${event.name} in workspace ${event.workspaceId}: ` +
            describeError(error),
        );
      }
    }
  }
}
