import { InventoryMovementReason } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type { InventoryItemRepository } from '../repositories/inventory-item.repository.js';
import type { StockLevelsWriter } from '../repositories/stock-levels.writer.js';
import { CatalogEventBus } from '../../events/services/catalog-event-bus.js';
import { WORKSPACE_ID } from './inventory.fixtures.js';
import { StockLevelsService } from './stock-levels.service.js';

const ITEM = { inventoryItemId: 'item-1', productId: 'product-1', sku: 'MUG-1', tracked: true };

function setup() {
  const items = { findBySkus: vi.fn<InventoryItemRepository['findBySkus']>() };
  items.findBySkus.mockResolvedValue([ITEM]);
  const writer = { setAvailable: vi.fn<StockLevelsWriter['setAvailable']>() };
  writer.setAvailable.mockResolvedValue();
  const events = new CatalogEventBus();
  const stockChanged = vi.spyOn(events, 'stockChanged');
  const service = new StockLevelsService(
    items as unknown as InventoryItemRepository,
    writer as unknown as StockLevelsWriter,
    events,
  );
  return { service, items, writer, stockChanged };
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

  it('tells listeners which items changed, so channels get the new stock', async () => {
    const { service, stockChanged } = setup();

    await service.setAvailable(WORKSPACE_ID, [{ inventoryItemId: 'item-1', available: 4 }], {
      reason: InventoryMovementReason.IMPORTED,
      actor: Actor.system(),
    });

    expect(stockChanged).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      inventoryItemIds: ['item-1'],
    });
  });
});
