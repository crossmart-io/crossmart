import { PublishRequirement } from '@crossmart/connectors';
import { ListingStatus, ProductStatus } from '@crossmart/database';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import type {
  ChannelProductsRepository,
  DisplayCandidateRecord,
} from '../repositories/channel-products.repository.js';
import { CONNECTION_ID, connectionView, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { ChannelProductDisplays } from './channel-product-displays.js';
import { StoreListingStates } from './store-listing-states.js';

function candidate(id: string, failed = false): DisplayCandidateRecord {
  return {
    id,
    status: ProductStatus.ACTIVE,
    optionNames: [],
    media: [],
    _count: { variants: 1 },
    listings: failed
      ? [
          {
            connectionId: CONNECTION_ID,
            status: ListingStatus.ERROR,
            lastError: null,
            missingRequirement: null,
            syncRequestedAt: null,
            override: null,
          },
        ]
      : [],
  };
}

function setup(batches: DisplayCandidateRecord[][]) {
  const products = {
    count: vi.fn<ChannelProductsRepository['count']>().mockResolvedValue(2),
    listDisplayCandidateBatch: vi.fn<ChannelProductsRepository['listDisplayCandidateBatch']>(),
  };
  for (const batch of batches) products.listDisplayCandidateBatch.mockResolvedValueOnce(batch);
  const displays = {
    resolve: vi.fn<ChannelProductDisplays['resolve']>((_connection, product) => ({
      state: product.listing ? ListingDisplayState.Failed : ListingDisplayState.Ready,
      reason: null,
      requirement: null,
    })),
  };
  const service = new StoreListingStates(
    products as unknown as ChannelProductsRepository,
    displays as unknown as ChannelProductDisplays,
  );
  return { service, products, displays };
}

describe('StoreListingStates', () => {
  it('counts every product as needing details while the store’s setup blocks publishing', async () => {
    const { service, products } = setup([]);
    const blocked = connectionView({
      publishReadiness: {
        ready: false,
        unmet: [{ requirement: PublishRequirement.ShippingPolicy, reason: 'Pick a policy' }],
      },
    });

    const counts = await service.count(WORKSPACE_ID, blocked);

    expect(products.listDisplayCandidateBatch).not.toHaveBeenCalled();
    expect(counts).toEqual({
      [ListingDisplayState.Draft]: 2,
      [ListingDisplayState.NeedsDetails]: 2,
      [ListingDisplayState.Ready]: 0,
      [ListingDisplayState.Publishing]: 2,
      [ListingDisplayState.Published]: 2,
      [ListingDisplayState.Failed]: 2,
      [ListingDisplayState.Removing]: 2,
      [ListingDisplayState.Removed]: 4,
    });
  });

  it('checks selected products off the channel in batches, as their connector would', async () => {
    const full = Array.from({ length: SELECTION_BATCH_SIZE }, (_, index) =>
      candidate(`p-${index}`),
    );
    const { service, products, displays } = setup([full, [candidate('p-x', true)]]);

    const counts = await service.count(WORKSPACE_ID, connectionView());

    expect(products.listDisplayCandidateBatch).toHaveBeenCalledTimes(2);
    expect(products.listDisplayCandidateBatch.mock.calls[1]?.[1]).toEqual({
      afterId: `p-${SELECTION_BATCH_SIZE - 1}`,
      size: SELECTION_BATCH_SIZE,
    });
    expect(displays.resolve).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        product: expect.objectContaining({ id: 'p-x', variantCount: 1 }),
        listing: expect.objectContaining({ status: ListingStatus.ERROR }),
      }),
      { selected: new Set(['p-x']), removedByHand: new Set() },
    );
    expect(counts[ListingDisplayState.Ready]).toBe(SELECTION_BATCH_SIZE);
    expect(counts[ListingDisplayState.Failed]).toBe(3);
    expect(counts[ListingDisplayState.NeedsDetails]).toBe(0);
  });
});
