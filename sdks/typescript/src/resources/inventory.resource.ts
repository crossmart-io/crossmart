import { MAX_PAGE_SIZE } from '../crossmart.constants.js';
import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import { type Page, paginate } from '../pagination.js';
import type {
  AdjustStockInput,
  InventoryItem,
  InventoryMovement,
  ListAllInventoryQuery,
  ListAllMovementsQuery,
  ListInventoryQuery,
  ListMovementsQuery,
} from '../types.js';
import { Resource } from './resource.js';

const INVENTORY_PATH = '/api/v1/workspaces/{workspaceId}/inventory-items';
const ADJUSTMENTS_PATH =
  '/api/v1/workspaces/{workspaceId}/inventory-items/{inventoryItemId}/adjustments';
const MOVEMENTS_PATH =
  '/api/v1/workspaces/{workspaceId}/inventory-items/{inventoryItemId}/movements';

/**
 * Stock per variant: on hand, reserved for open orders, and available to sell. Needs
 * `inventory:view`, and `inventory:edit` to adjust.
 */
export class InventoryResource extends Resource {
  /**
   * One page of inventory items (one per variant).
   *
   * @example
   * ```ts
   * const page = await crossmart.inventory.list({ stockLevel: StockLevel.low_stock });
   * ```
   */
  async list(
    query: ListInventoryQuery = {},
    options?: RequestOptions,
  ): Promise<Page<InventoryItem>> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(INVENTORY_PATH, {
        params: { path: { workspaceId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Every inventory item that matches `query`.
   *
   * @example
   * ```ts
   * for await (const item of crossmart.inventory.listAll()) {
   *   console.log(item.sku, item.available);
   * }
   * ```
   */
  listAll(
    query: ListAllInventoryQuery = {},
    options?: RequestOptions,
  ): AsyncGenerator<InventoryItem, void> {
    return paginate((cursor) => this.list({ limit: MAX_PAGE_SIZE, ...query, cursor }, options));
  }

  /**
   * Changes a variant's stock: `delta` adds or removes units, `set` sets the count. Every change
   * is recorded in the stock history with its reason, and pushed to the stores.
   *
   * @example
   * ```ts
   * await crossmart.inventory.adjust(item.inventoryItemId, {
   *   mode: StockAdjustmentMode.delta,
   *   quantity: 12,
   *   reason: InventoryMovementReason.RECEIVED,
   *   note: 'PO 1042',
   * });
   * ```
   */
  async adjust(
    inventoryItemId: string,
    input: AdjustStockInput,
    options?: RequestOptions,
  ): Promise<InventoryItem> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(ADJUSTMENTS_PATH, {
        params: { path: { workspaceId, inventoryItemId } },
        body: input,
        signal: options?.signal,
      }),
    );
  }

  /**
   * One page of an item's stock history, newest first by default.
   *
   * @example
   * ```ts
   * const history = await crossmart.inventory.listMovements(item.inventoryItemId, { limit: 20 });
   * ```
   */
  async listMovements(
    inventoryItemId: string,
    query: ListMovementsQuery = {},
    options?: RequestOptions,
  ): Promise<Page<InventoryMovement>> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(MOVEMENTS_PATH, {
        params: { path: { workspaceId, inventoryItemId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * An item's whole stock history.
   *
   * @example
   * ```ts
   * for await (const movement of crossmart.inventory.listAllMovements(item.inventoryItemId)) {
   *   console.log(movement.reason, movement.delta);
   * }
   * ```
   */
  listAllMovements(
    inventoryItemId: string,
    query: ListAllMovementsQuery = {},
    options?: RequestOptions,
  ): AsyncGenerator<InventoryMovement, void> {
    return paginate((cursor) =>
      this.listMovements(inventoryItemId, { limit: MAX_PAGE_SIZE, ...query, cursor }, options),
    );
  }
}
