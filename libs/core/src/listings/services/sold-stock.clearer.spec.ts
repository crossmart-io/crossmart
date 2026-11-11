import { InventoryMovementReason } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type { StockLevelsService } from '../../inventory/services/stock-levels.service.js';
import type { SaleStockItem } from '../entities/product-sale.js';
import type { ProductSaleRepository } from '../repositories/product-sale.repository.js';
import { PRODUCT_ID, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import { SoldStockClearer } from './sold-stock.clearer.js';

const ACTOR = Actor.user('user-1');

function setup(stock: SaleStockItem[]) {
  const sales = { findStock: vi.fn<ProductSaleRepository['findStock']>().mockResolvedValue(stock) };
  const levels = { setAvailable: vi.fn<StockLevelsService['setAvailable']>().mockResolvedValue() };
  const clearer = new SoldStockClearer(
    sales as unknown as ProductSaleRepository,
    levels as unknown as StockLevelsService,
  );
  return { clearer, levels };
}

describe('SoldStockClearer', () => {
  it('sets each tracked variant with stock to 0, as sold, and counts the units', async () => {
    const { clearer, levels } = setup([
      { inventoryItemId: 'i-1', tracked: true, available: 1 },
      { inventoryItemId: 'i-2', tracked: true, available: 2 },
      { inventoryItemId: 'i-3', tracked: false, available: 5 },
      { inventoryItemId: 'i-4', tracked: true, available: 0 },
    ]);

    expect(await clearer.clear(WORKSPACE_ID, PRODUCT_ID, ACTOR)).toBe(3);

    expect(levels.setAvailable).toHaveBeenCalledWith(
      WORKSPACE_ID,
      [
        { inventoryItemId: 'i-1', available: 0 },
        { inventoryItemId: 'i-2', available: 0 },
      ],
      { reason: InventoryMovementReason.SOLD, actor: ACTOR },
    );
  });

  it('writes nothing when no tracked variant has stock left', async () => {
    const { clearer, levels } = setup([{ inventoryItemId: 'i-1', tracked: false, available: 0 }]);

    expect(await clearer.clear(WORKSPACE_ID, PRODUCT_ID, ACTOR)).toBe(0);
    expect(levels.setAvailable).not.toHaveBeenCalled();
  });
});
