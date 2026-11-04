import { InventoryMovementReason } from '@crossmart/database';
import type {
  InventoryMovementRecord,
  InventoryRowRecord,
} from '../repositories/inventory.queries.js';

export const WORKSPACE_ID = 'ws-1';
export const ITEM_ID = 'item-1';
const UPDATED_AT = new Date('2026-11-02T10:00:00Z');

/** An inventory item as the repository loads it, for service tests. */
export function inventoryRecord(overrides: Partial<InventoryRowRecord> = {}): InventoryRowRecord {
  return {
    id: ITEM_ID,
    workspaceId: WORKSPACE_ID,
    variantId: 'variant-1',
    tracked: true,
    available: 7,
    reserved: 2,
    updatedAt: UPDATED_AT,
    variant: {
      productId: 'product-1',
      sku: 'MUG-BLUE',
      optionValues: ['Blue'],
      product: { title: 'Stoneware Mug', media: [{ url: 'https://cdn.test/mug.png' }] },
    },
    ...overrides,
  };
}

export function movementRecord(
  overrides: Partial<InventoryMovementRecord> = {},
): InventoryMovementRecord {
  return {
    id: 'movement-1',
    workspaceId: WORKSPACE_ID,
    inventoryItemId: ITEM_ID,
    delta: 5,
    reason: InventoryMovementReason.RECEIVED,
    quantityAfter: 9,
    note: 'Spring delivery',
    actorUserId: 'user-1',
    actorUser: { name: 'Dana' },
    apiKeyId: null,
    apiKey: null,
    createdAt: UPDATED_AT,
    ...overrides,
  };
}
