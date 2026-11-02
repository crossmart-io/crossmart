import { NotFoundException } from '@nestjs/common';
import { StockLevel } from '../enums/stock-level.enum.js';
import type { InventoryItemRepository } from '../repositories/inventory-item.repository.js';
import type { InventoryMovementRepository } from '../repositories/inventory-movement.repository.js';
import { inventoryRecord, ITEM_ID, movementRecord, WORKSPACE_ID } from './inventory.fixtures.js';
import { InventoryService } from './inventory.service.js';

function setup() {
  const items = {
    listPage: vi.fn<InventoryItemRepository['listPage']>().mockResolvedValue([inventoryRecord()]),
    exists: vi.fn<InventoryItemRepository['exists']>().mockResolvedValue(true),
  };
  const movements = {
    listPage: vi.fn<InventoryMovementRepository['listPage']>().mockResolvedValue([]),
  };
  return {
    service: new InventoryService(
      items as unknown as InventoryItemRepository,
      movements as unknown as InventoryMovementRepository,
    ),
    items,
    movements,
  };
}

describe('InventoryService', () => {
  it('shows on hand as available plus reserved, with the stock level', async () => {
    const { service } = setup();

    const page = await service.list(WORKSPACE_ID, { limit: 10 });

    expect(page.nextCursor).toBeNull();
    expect(page.items[0]).toMatchObject({
      inventoryItemId: ITEM_ID,
      productTitle: 'Stoneware Mug',
      sku: 'MUG-BLUE',
      imageUrl: 'https://cdn.test/mug.png',
      onHand: 9,
      reserved: 2,
      available: 7,
      stockLevel: StockLevel.InStock,
    });
  });

  it('returns a cursor when the repository found one row more than the limit', async () => {
    const { service, items } = setup();
    items.listPage.mockResolvedValue([
      inventoryRecord({ id: 'item-a' }),
      inventoryRecord({ id: 'item-b' }),
    ]);

    const page = await service.list(WORKSPACE_ID, { limit: 1 });

    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe('item-a');
  });

  it('names who made each change in the history', async () => {
    const { service, movements } = setup();
    movements.listPage.mockResolvedValue([
      movementRecord(),
      movementRecord({
        id: 'movement-2',
        actorUserId: null,
        actorUser: null,
        apiKeyId: 'key-1',
        apiKey: { name: 'Stock bot' },
      }),
    ]);

    const history = await service.history(WORKSPACE_ID, ITEM_ID, { limit: 10 });

    expect(history.items.map(({ userName, apiKeyName }) => [userName, apiKeyName])).toEqual([
      ['Dana', null],
      [null, 'Stock bot'],
    ]);
  });

  it('404s the history of an item from another workspace', async () => {
    const { service, items, movements } = setup();
    items.exists.mockResolvedValue(false);

    await expect(service.history(WORKSPACE_ID, ITEM_ID, { limit: 10 })).rejects.toThrow(
      NotFoundException,
    );
    expect(movements.listPage).not.toHaveBeenCalled();
  });
});
