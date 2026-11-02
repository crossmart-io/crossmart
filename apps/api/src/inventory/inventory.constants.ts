export const INVENTORY_TAG = 'Inventory';
export const INVENTORY_ITEMS_ROUTE = 'workspaces/:workspaceId/inventory-items';
export const INVENTORY_ITEM_ID_PARAM = 'inventoryItemId';
export const ADJUSTMENTS_PATH = `:${INVENTORY_ITEM_ID_PARAM}/adjustments`;
export const MOVEMENTS_PATH = `:${INVENTORY_ITEM_ID_PARAM}/movements`;

export const INVENTORY_SEARCH_MAX_LENGTH = 200;

/** Schema names the generated web client uses for the inventory enums. */
export const STOCK_LEVEL_SCHEMA_NAME = 'StockLevel';
export const STOCK_ADJUSTMENT_MODE_SCHEMA_NAME = 'StockAdjustmentMode';
export const INVENTORY_MOVEMENT_REASON_SCHEMA_NAME = 'InventoryMovementReason';
