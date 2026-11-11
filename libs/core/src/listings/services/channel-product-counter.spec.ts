import type { ChannelProductsRepository } from '../repositories/channel-products.repository.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { CONNECTION_ID, connectionView, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import { ChannelProductCounter } from './channel-product-counter.js';
import type { StoreListingStates } from './store-listing-states.js';

const SEARCH = { title: { contains: 'mug' } };
const STATE_COUNTS: Record<ChannelProductState, number> = {
  [ChannelProductState.Listed]: 4,
  [ChannelProductState.Pending]: 3,
  [ChannelProductState.Failed]: 2,
  [ChannelProductState.Removing]: 1,
  [ChannelProductState.RemovedByHand]: 1,
  [ChannelProductState.Excluded]: 5,
};
const STATES = Object.values(ChannelProductState);

function setup() {
  const products = {
    count: vi.fn<ChannelProductsRepository['count']>(),
  };
  for (const state of STATES) products.count.mockResolvedValueOnce(STATE_COUNTS[state]);
  const listingStates = {
    countNeedsDetails: vi
      .fn<StoreListingStates['countNeedsDetails']>()
      .mockResolvedValue({ total: 3, unsent: 2 }),
  };
  const counter = new ChannelProductCounter(
    products as unknown as ChannelProductsRepository,
    listingStates as unknown as StoreListingStates,
  );
  const target = {
    scope: { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, rule: null },
    connection: connectionView(),
  };
  return { counter, products, listingStates, target };
}

describe('ChannelProductCounter', () => {
  it('counts each state, and the products that need details or attention', async () => {
    const { counter, target } = setup();

    const counts = await counter.count(target, SEARCH);

    expect(counts).toEqual({ ...STATE_COUNTS, needsDetails: 3, needsAttention: 4 });
  });

  it('counts within the search, in the workspace', async () => {
    const { counter, products, listingStates, target } = setup();

    await counter.count(target, SEARCH);

    expect(products.count).toHaveBeenCalledTimes(STATES.length);
    for (const [where] of products.count.mock.calls) {
      expect(where).toEqual({
        AND: [expect.objectContaining({ workspaceId: WORKSPACE_ID }), SEARCH],
      });
    }
    expect(listingStates.countNeedsDetails).toHaveBeenCalledWith(
      WORKSPACE_ID,
      target.connection,
      SEARCH,
    );
  });
});
