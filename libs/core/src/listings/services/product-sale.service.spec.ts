import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ProductsService } from '../../catalog/services/products.service.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import {
  CONNECTION_ID,
  connectionView,
  PRODUCT_ID,
  productDetail,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ProductSaleService } from './product-sale.service.js';
import type { SoldProductStores } from './sold-product.stores.js';
import type { SoldStockClearer } from './sold-stock.clearer.js';

const ACTOR = Actor.user('user-1');

function setup(unitsCleared: number, removed: ChannelConnectionView[]) {
  const products = {
    get: vi.fn<ProductsService['get']>().mockResolvedValue(productDetail()),
  };
  const stock = { clear: vi.fn<SoldStockClearer['clear']>().mockResolvedValue(unitsCleared) };
  const stores = { takeOff: vi.fn<SoldProductStores['takeOff']>().mockResolvedValue(removed) };
  const activity = new InMemoryActivityRecorder();
  const service = new ProductSaleService(
    products as unknown as ProductsService,
    stock as unknown as SoldStockClearer,
    stores as unknown as SoldProductStores,
    activity,
  );
  return { service, products, stock, stores, activity };
}

describe('ProductSaleService', () => {
  it('clears the stock, takes it off its stores and logs one sale', async () => {
    const { service, stock, stores, activity } = setup(3, [connectionView()]);

    const sale = await service.markSold(WORKSPACE_ID, PRODUCT_ID, ACTOR);

    expect(stock.clear).toHaveBeenCalledWith(WORKSPACE_ID, PRODUCT_ID, ACTOR);
    expect(stores.takeOff).toHaveBeenCalledWith(WORKSPACE_ID, PRODUCT_ID, ACTOR);
    expect(sale).toMatchObject({
      unitsCleared: 3,
      alreadySold: false,
      removedFromStores: [{ connectionId: CONNECTION_ID, displayName: 'Demo Store' }],
    });
    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.ProductMarkedSold,
        subject: expect.objectContaining({ id: PRODUCT_ID, label: 'Mug' }),
        itemCount: 3,
      }),
    ]);
  });

  it('logs a sale that only took the product off its stores', async () => {
    const { service, activity } = setup(0, [connectionView()]);

    const sale = await service.markSold(WORKSPACE_ID, PRODUCT_ID, ACTOR);

    expect(sale.alreadySold).toBe(false);
    expect(activity.entries).toHaveLength(1);
  });

  it('changes nothing and logs nothing for a product already sold', async () => {
    const { service, products, activity } = setup(0, []);

    const sale = await service.markSold(WORKSPACE_ID, PRODUCT_ID, ACTOR);

    expect(sale).toMatchObject({ unitsCleared: 0, removedFromStores: [], alreadySold: true });
    expect(activity.entries).toEqual([]);
    expect(products.get).toHaveBeenCalledTimes(1);
  });

  it('refuses a product outside the workspace before changing anything', async () => {
    const { service, products, stock, stores } = setup(0, []);
    products.get.mockRejectedValue(new Error('Product not found'));

    await expect(service.markSold(WORKSPACE_ID, PRODUCT_ID, ACTOR)).rejects.toThrow(
      'Product not found',
    );
    expect(stock.clear).not.toHaveBeenCalled();
    expect(stores.takeOff).not.toHaveBeenCalled();
  });
});
