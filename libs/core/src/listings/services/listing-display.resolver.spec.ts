import {
  ChannelCapability,
  type ChannelConnector,
  type ChannelConnectorRegistry,
  ChannelType,
  type PublishCandidate,
  PublishRequirement,
} from '@crossmart/connectors';
import { ListingStatus } from '@crossmart/database';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { connectionView } from '../testing/listing.fixtures.js';
import { ListingDisplayResolver } from './listing-display.resolver.js';

const NO_IMAGES = { requirement: PublishRequirement.Images, reason: 'Add a photo' };
const NO_POLICY = { requirement: PublishRequirement.ShippingPolicy, reason: 'Choose a policy' };
const CANDIDATE: PublishCandidate = {
  imageUrls: [],
  active: true,
  optionNames: [],
  variantCount: 1,
};
const SUBJECT = { selected: true, removedByHand: false, listing: null, candidate: CANDIDATE };

function setup(capabilities = [ChannelCapability.PublishListings]) {
  const check = vi.fn((candidate: PublishCandidate) =>
    candidate.imageUrls.length > 0 ? [] : [NO_IMAGES],
  );
  const connector = { capabilities: new Set(capabilities), unmetProductRequirements: check };
  const registry = { require: vi.fn(() => connector as unknown as ChannelConnector) };
  const resolver = new ListingDisplayResolver(registry as unknown as ChannelConnectorRegistry);
  return { resolver, registry, check };
}

describe('ListingDisplayResolver', () => {
  it('needs details when the store’s connector says the product lacks something', () => {
    const { resolver, registry, check } = setup();
    const store = connectionView({ channel: ChannelType.Ebay });

    expect(resolver.resolve(store, SUBJECT)).toEqual({
      state: ListingDisplayState.NeedsDetails,
      reason: NO_IMAGES.reason,
      requirement: PublishRequirement.Images,
    });
    expect(registry.require).toHaveBeenCalledWith(ChannelType.Ebay);
    expect(check).toHaveBeenCalledWith(CANDIDATE);
  });

  it('names the store’s setup before the product’s details', () => {
    const { resolver } = setup();
    const store = connectionView({ publishReadiness: { ready: false, unmet: [NO_POLICY] } });

    expect(resolver.resolve(store, SUBJECT)).toMatchObject({
      reason: NO_POLICY.reason,
      requirement: PublishRequirement.ShippingPolicy,
    });
  });

  it('is ready when neither the store nor the product lacks anything', () => {
    const { resolver } = setup();

    const display = resolver.resolve(connectionView(), {
      ...SUBJECT,
      candidate: { ...CANDIDATE, imageUrls: ['https://cdn.example.com/1.jpg'] },
    });

    expect(display.state).toBe(ListingDisplayState.Ready);
  });

  it('skips the product check on channels that do not publish', () => {
    const { resolver, check } = setup([]);

    const display = resolver.resolve(connectionView(), {
      ...SUBJECT,
      listing: {
        status: ListingStatus.PENDING,
        lastError: null,
        missingRequirement: null,
        syncRequestedAt: null,
      },
    });

    expect(display.state).toBe(ListingDisplayState.Publishing);
    expect(check).not.toHaveBeenCalled();
  });
});
