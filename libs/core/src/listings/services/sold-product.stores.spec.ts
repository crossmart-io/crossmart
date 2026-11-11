import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ProductSaleRepository } from '../repositories/product-sale.repository.js';
import { connectionView, PRODUCT_ID, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { ProductSelectionService } from './product-selection.service.js';
import { SoldProductStores } from './sold-product.stores.js';
import type { StoreMembershipService } from './store-membership.service.js';

const ACTOR = Actor.user('user-1');
const RULE = { filter: {}, includeProductIds: [], excludeProductIds: [] };
const withRule = (id: string, excludeProductIds: string[] = []) =>
  connectionView({
    id,
    settings: { account: null, productSelection: { ...RULE, excludeProductIds }, pricing: null },
  });
const STORES = [
  connectionView({ id: 'c-listed' }),
  withRule('c-rule'),
  connectionView({ id: 'c-unrelated' }),
  withRule('c-removed', [PRODUCT_ID]),
  connectionView({ id: 'c-gone', status: ChannelConnectionStatus.DISCONNECTED }),
];

function setup() {
  const connections = {
    list: vi.fn<ChannelConnectionsService['list']>().mockResolvedValue(STORES),
  };
  const sales = {
    findListedConnectionIds: vi
      .fn<ProductSaleRepository['findListedConnectionIds']>()
      .mockResolvedValue(new Set(['c-listed', 'c-removed', 'c-gone'])),
  };
  const selection = {
    includes: vi
      .fn<ProductSelectionService['includes']>()
      .mockImplementation((scope) => Promise.resolve(scope.connectionId === 'c-rule')),
  };
  const membership = { remove: vi.fn<StoreMembershipService['remove']>().mockResolvedValue() };
  const stores = new SoldProductStores(
    connections as unknown as ChannelConnectionsService,
    sales as unknown as ProductSaleRepository,
    selection as unknown as ProductSelectionService,
    membership as unknown as StoreMembershipService,
  );
  return { stores, selection, membership };
}

describe('SoldProductStores', () => {
  it('removes it by hand from each connected store that lists it or whose rule would', async () => {
    const { stores, membership } = setup();

    const removed = await stores.takeOff(WORKSPACE_ID, PRODUCT_ID, ACTOR);

    expect(removed.map((store) => store.id)).toEqual(['c-listed', 'c-rule']);
    expect(membership.remove.mock.calls).toEqual([
      [{ workspaceId: WORKSPACE_ID, connectionId: 'c-listed', productIds: [PRODUCT_ID] }, ACTOR],
      [{ workspaceId: WORKSPACE_ID, connectionId: 'c-rule', productIds: [PRODUCT_ID] }, ACTOR],
    ]);
  });

  it('skips stores it was removed from already and disconnected ones', async () => {
    const { stores, selection } = setup();

    await stores.takeOff(WORKSPACE_ID, PRODUCT_ID, ACTOR);

    const asked = selection.includes.mock.calls.map(([scope]) => scope.connectionId);
    expect(asked).toEqual(['c-rule', 'c-unrelated']);
  });
});
