import { InventoryMovementReason } from '@crossmart/database';

export const INVENTORY_PAGE_DEFAULT_LIMIT = 50;
export const INVENTORY_PAGE_MAX_LIMIT = 100;
export const MOVEMENT_PAGE_DEFAULT_LIMIT = 25;
export const MOVEMENT_PAGE_MAX_LIMIT = 100;

/** A tracked variant with this many units available or fewer is low on stock. */
export const LOW_STOCK_THRESHOLD = 5;
/** The most units one variant may hold on hand, far below the limit of the integer column. */
export const MAX_STOCK_QUANTITY = 1_000_000;
export const MOVEMENT_NOTE_MAX_LENGTH = 500;

/** Reasons a person or an agent may give for an adjustment. The others are written by the system. */
export const MANUAL_MOVEMENT_REASONS: readonly InventoryMovementReason[] = [
  InventoryMovementReason.RECEIVED,
  InventoryMovementReason.CORRECTION,
  InventoryMovementReason.RETURNED,
  InventoryMovementReason.DAMAGED,
  InventoryMovementReason.LOST,
  InventoryMovementReason.SOLD,
];

export const INVENTORY_ITEM_NOT_FOUND = 'Inventory item not found';

/** How each reason reads in the activity log: "MUG-BLUE +5, received". */
export const MOVEMENT_REASON_LABELS: Record<InventoryMovementReason, string> = {
  [InventoryMovementReason.OPENING_BALANCE]: 'opening balance',
  [InventoryMovementReason.ADJUSTMENT]: 'product edited',
  [InventoryMovementReason.CORRECTION]: 'count correction',
  [InventoryMovementReason.RECEIVED]: 'received',
  [InventoryMovementReason.RETURNED]: 'returned',
  [InventoryMovementReason.DAMAGED]: 'damaged',
  [InventoryMovementReason.LOST]: 'lost',
  [InventoryMovementReason.SOLD]: 'sold',
  [InventoryMovementReason.IMPORTED]: 'imported',
  [InventoryMovementReason.ORDER_SHIPPED]: 'shipped',
};
/** Separates option values when a variant without a SKU is named: "Blue / Large". */
export const OPTION_VALUE_SEPARATOR = ' / ';
