import { CatalogChangeKind } from '../enums/catalog-change-kind.enum.js';
import type { CatalogChangeListener } from '../entities/catalog-events.js';
import { CatalogEventBus } from './catalog-event-bus.js';

function listener(): CatalogChangeListener & {
  onProductsChanged: ReturnType<typeof vi.fn>;
  onStockChanged: ReturnType<typeof vi.fn>;
  onProductsDeleting: ReturnType<typeof vi.fn>;
} {
  return {
    onProductsChanged: vi.fn(() => Promise.resolve()),
    onStockChanged: vi.fn(() => Promise.resolve()),
    onProductsDeleting: vi.fn(() => Promise.resolve()),
  };
}

describe('CatalogEventBus', () => {
  it('delivers events to every listener, skipping empty ones', async () => {
    const bus = new CatalogEventBus();
    const first = listener();
    const second = listener();
    bus.subscribe(first);
    bus.subscribe(second);

    const event = { workspaceId: 'w', productIds: ['p'], kinds: [CatalogChangeKind.Content] };
    await bus.productsChanged(event);
    await bus.productsChanged({ ...event, productIds: [] });
    await bus.stockChanged({ workspaceId: 'w', inventoryItemIds: ['i'] });

    expect(first.onProductsChanged).toHaveBeenCalledTimes(1);
    expect(second.onProductsChanged).toHaveBeenCalledWith(event);
    expect(second.onStockChanged).toHaveBeenCalledTimes(1);
  });

  it('never lets a failing listener fail the publisher or the others', async () => {
    const bus = new CatalogEventBus();
    const healthy = listener();
    bus.subscribe({ ...listener(), onStockChanged: () => Promise.reject(new Error('down')) });
    bus.subscribe(healthy);

    await expect(
      bus.stockChanged({ workspaceId: 'w', inventoryItemIds: ['i'] }),
    ).resolves.toBeUndefined();
    expect(healthy.onStockChanged).toHaveBeenCalled();
  });

  it('tells listeners about products before they are deleted, skipping an empty list', async () => {
    const bus = new CatalogEventBus();
    const subscriber = listener();
    bus.subscribe(subscriber);

    await bus.productsDeleting({ workspaceId: 'w', productIds: ['p'] });
    await bus.productsDeleting({ workspaceId: 'w', productIds: [] });

    expect(subscriber.onProductsDeleting).toHaveBeenCalledTimes(1);
    expect(subscriber.onProductsDeleting).toHaveBeenCalledWith({
      workspaceId: 'w',
      productIds: ['p'],
    });
  });
});
