import { InventoryMovementReason } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type { InventoryItemRepository } from '../repositories/inventory-item.repository.js';
import type { StockLevelsWriter } from '../repositories/stock-levels.writer.js';
import { WORKSPACE_ID } from './inventory.fixtures.js';
import { StockLevelsService } from './stock-levels.service.js';

const ITEM = { inventoryItemId: 'item-1', productId: 'product-1', sku: 'MUG-1', tracked: true };

function setup() {
  const items = { findBySkus: vi.fn<InventoryItemRepository['findBySkus']>() };
  items.findBySkus.mockResolvedValue([ITEM]);
  const writer = { setAvailable: vi.fn<StockLevelsWriter['setAvailable']>() };
  writer.setAvailable.mockResolvedValue();
  const service = new StockLevelsService(
    items as unknown as InventoryItemRepository,
    writer as unknown as StockLevelsWriter,
  );
  return { service, items, writer };
}

describe('StockLevelsService', () => {
  it('finds stock items by SKU within the workspace', async () => {
    const { service, items } = setup();

    await expect(service.findBySkus(WORKSPACE_ID, ['MUG-1'])).resolves.toEqual([ITEM]);
    expect(items.findBySkus).toHaveBeenCalledWith(WORKSPACE_ID, ['MUG-1']);
  });

  it('writes the levels through the ledger with their reason and author', async () => {
    const { service, writer } = setup();
    const change = { reason: InventoryMovementReason.IMPORTED, actor: Actor.user('user-1') };
    const targets = [{ inventoryItemId: 'item-1', available: 12 }];

    await service.setAvailable(WORKSPACE_ID, targets, change);

    expect(writer.setAvailable).toHaveBeenCalledWith(WORKSPACE_ID, targets, change);
  });
});
