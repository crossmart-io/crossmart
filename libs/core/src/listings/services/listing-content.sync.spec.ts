import {
  ChannelCapability,
  ChannelError,
  ChannelErrorCode,
  ChannelType,
  type ListingPublisher,
  type PublishedListing,
} from '@crossmart/connectors';
import { ActivityOutcome, ListingStatus } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import { ListingTargetAction } from '../enums/listing-target-action.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  LISTING_ID,
  listingRecord,
  PRODUCT_ID,
  productDetail,
  publishedListing,
  syncConnection,
  syncJob,
  VARIANT_ID,
} from '../testing/listing.fixtures.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';
import { ListingContentSync } from './listing-content.sync.js';
import { ListingDraftBuilder } from './listing-draft.builder.js';
import { ListingSyncFailures } from './listing-sync-failures.js';
import { ListingSyncOutcomes } from './listing-sync-outcomes.js';
import type { ListingTarget, ListingTargetResolver } from './listing-target.resolver.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';

const PUBLISHED: PublishedListing = {
  externalId: 'gid://shopify/Product/1',
  externalUrl: 'https://demo.myshopify.com/products/mug',
  active: true,
  variants: [{ variantId: VARIANT_ID, externalId: 'v1', externalInventoryId: 'i1' }],
};

function setup(target: ListingTarget) {
  const publisher = {
    publish: vi.fn<ListingPublisher['publish']>().mockResolvedValue(PUBLISHED),
    update: vi.fn<ListingPublisher['update']>().mockResolvedValue(PUBLISHED),
    delist: vi.fn<ListingPublisher['delist']>().mockResolvedValue(),
    updatePrices: vi.fn<ListingPublisher['updatePrices']>().mockResolvedValue(),
  };
  const connector = {
    ...publisher,
    channel: ChannelType.Shopify,
    capabilities: new Set([ChannelCapability.PublishListings]),
  } as unknown as ConnectorDouble;
  const connections = {
    load: vi.fn<SyncConnectionLoader['load']>().mockResolvedValue(syncConnection(connector)),
    openSession: vi.fn<SyncConnectionLoader['openSession']>().mockResolvedValue({
      connectionId: CONNECTION_ID,
      externalAccountId: 'demo.myshopify.com',
      grantedScopes: [],
      accessToken: () => Promise.resolve('token'),
    }),
  };
  const targets = {
    forPublish: vi.fn<ListingTargetResolver['forPublish']>().mockResolvedValue(target),
    forDelist: vi.fn<ListingTargetResolver['forDelist']>().mockResolvedValue(target),
  };
  const listings = {
    recordPublished: vi.fn<ListingSyncRepository['recordPublished']>().mockResolvedValue(),
    recordFailure: vi.fn<ListingSyncRepository['recordFailure']>().mockResolvedValue(),
    markDelisted: vi.fn<ListingSyncRepository['markDelisted']>().mockResolvedValue(),
  };
  const records = {
    markSynced: vi.fn<ChannelConnectionRepository['markSynced']>().mockResolvedValue(),
  };
  const activity = new InMemoryActivityRecorder();
  const repository = listings as unknown as ListingSyncRepository;
  const sync = new ListingContentSync(
    connections as unknown as SyncConnectionLoader,
    targets as unknown as ListingTargetResolver,
    new ListingDraftBuilder(new ChannelPriceResolver()),
    new ListingSyncOutcomes(
      repository,
      records as unknown as ChannelConnectionRepository,
      activity,
      new ListingSyncFailures(repository, activity),
    ),
  );
  return { sync, publisher, listings, activity, connections };
}

describe('ListingContentSync', () => {
  it('sends nothing for a publish the plan blocks, and shows why on the listing', async () => {
    const reason = 'The Free plan includes 50 active listings, and 50 are in use.';
    const { sync, publisher, listings, activity, connections } = setup({
      action: ListingTargetAction.Blocked,
      product: productDetail(),
      listing: listingRecord(),
      reason,
    });

    await sync.publish(syncJob());

    expect(publisher.publish).not.toHaveBeenCalled();
    expect(connections.openSession).not.toHaveBeenCalled();
    expect(listings.recordFailure).toHaveBeenCalledWith(LISTING_ID, reason, ListingStatus.ERROR);
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ListingSyncFailed,
      outcome: ActivityOutcome.FAILED,
      failureReason: reason,
    });
  });

  it('publishes a product the channel does not have, and stores its channel ids', async () => {
    const { sync, publisher, listings, activity } = setup({
      action: ListingTargetAction.Publish,
      product: productDetail(),
      listing: listingRecord(),
    });

    await sync.publish(syncJob());

    expect(publisher.publish).toHaveBeenCalledTimes(1);
    expect(publisher.update).not.toHaveBeenCalled();
    expect(listings.recordPublished).toHaveBeenCalledWith(
      LISTING_ID,
      expect.objectContaining({
        externalId: PUBLISHED.externalId,
        status: ListingStatus.ACTIVE,
        variants: PUBLISHED.variants,
      }),
    );
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ListingPublished,
      subject: { label: 'Mug' },
      detail: 'Demo Store',
    });
  });

  it('updates the existing channel product instead of publishing a duplicate', async () => {
    const { sync, publisher, activity } = setup({
      action: ListingTargetAction.Publish,
      product: productDetail(),
      listing: publishedListing(),
    });

    await sync.publish(syncJob());

    expect(publisher.publish).not.toHaveBeenCalled();
    expect(publisher.update).toHaveBeenCalledWith(
      expect.anything(),
      'gid://shopify/Product/1',
      expect.objectContaining({ productId: productDetail().id }),
    );
    expect(activity.entries[0]?.action).toBe(ActivityAction.ListingUpdated);
  });

  it('delists a listing that is no longer selected', async () => {
    const listing = publishedListing();
    const { sync, publisher, listings, activity } = setup({
      action: ListingTargetAction.Delist,
      product: productDetail(),
      listing: { ...listing, externalId: 'gid://shopify/Product/1' },
    });

    await sync.publish(syncJob());

    expect(publisher.delist).toHaveBeenCalledWith(expect.anything(), 'gid://shopify/Product/1', {
      productId: PRODUCT_ID,
      variantExternalIds: ['gid://shopify/ProductVariant/1'],
    });
    expect(listings.markDelisted).toHaveBeenCalledWith(LISTING_ID, expect.any(Date));
    expect(activity.entries[0]?.action).toBe(ActivityAction.ListingDelisted);
  });

  it('marks the listing in error for a rejected publish, and logs it once', async () => {
    const { sync, publisher, listings, activity } = setup({
      action: ListingTargetAction.Publish,
      product: productDetail(),
      listing: listingRecord(),
    });
    publisher.publish.mockRejectedValue(
      new ChannelError(ChannelType.Shopify, ChannelErrorCode.RequestRejected, 'Title is invalid'),
    );

    await expect(sync.publish(syncJob())).resolves.toBeUndefined();

    expect(listings.recordFailure).toHaveBeenCalledWith(
      LISTING_ID,
      'Title is invalid',
      ListingStatus.ERROR,
    );
    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.ListingSyncFailed,
        outcome: ActivityOutcome.FAILED,
        failureReason: 'Title is invalid',
      }),
    ]);
  });

  it('rethrows outages for the queue to retry, noting them on the listing only', async () => {
    const { sync, publisher, listings, activity } = setup({
      action: ListingTargetAction.Publish,
      product: productDetail(),
      listing: listingRecord(),
    });
    const outage = new ChannelError(ChannelType.Shopify, ChannelErrorCode.RateLimited, 'Slow down');
    publisher.publish.mockRejectedValue(outage);

    await expect(sync.publish(syncJob())).rejects.toBe(outage);

    expect(listings.recordFailure).toHaveBeenCalledWith(LISTING_ID, 'Slow down');
    expect(activity.entries).toEqual([]);
  });

  it('drops jobs for connections that are gone or cannot publish', async () => {
    const { sync, publisher, connections } = setup({ action: ListingTargetAction.Skip });
    connections.load.mockResolvedValueOnce(null);

    await sync.publish(syncJob());
    await sync.delist(syncJob());

    expect(publisher.publish).not.toHaveBeenCalled();
    expect(publisher.delist).not.toHaveBeenCalled();
  });

  describe('a product deleted from the catalog', () => {
    const deletedJob = () => ({
      ...syncJob(),
      deleted: {
        externalId: 'gid://shopify/Product/9',
        productTitle: 'Mug',
        variantExternalIds: ['gid://shopify/ProductVariant/9'],
      },
    });

    it('is archived on the channel with the id its job kept, and logged', async () => {
      const { sync, publisher, listings, activity } = setup({ action: ListingTargetAction.Skip });

      await sync.delist(deletedJob());

      expect(publisher.delist).toHaveBeenCalledWith(expect.anything(), 'gid://shopify/Product/9', {
        productId: PRODUCT_ID,
        variantExternalIds: ['gid://shopify/ProductVariant/9'],
      });
      expect(listings.markDelisted).not.toHaveBeenCalled();
      expect(activity.entries).toEqual([
        expect.objectContaining({
          action: ActivityAction.ListingDelisted,
          subject: expect.objectContaining({ label: 'Mug' }),
        }),
      ]);
    });

    it('logs a rejected delist, and rethrows an outage for the queue to retry', async () => {
      const { sync, publisher, activity } = setup({ action: ListingTargetAction.Skip });
      publisher.delist.mockRejectedValueOnce(
        new ChannelError(ChannelType.Shopify, ChannelErrorCode.RequestRejected, 'Not found'),
      );
      const outage = new ChannelError(ChannelType.Shopify, ChannelErrorCode.RateLimited, 'Slow');
      publisher.delist.mockRejectedValueOnce(outage);

      await sync.delist(deletedJob());
      await expect(sync.delist(deletedJob())).rejects.toBe(outage);

      expect(activity.entries).toEqual([
        expect.objectContaining({
          action: ActivityAction.ListingSyncFailed,
          failureReason: 'Not found',
        }),
      ]);
    });

    it('is delisted from its listing when the job ran before the delete', async () => {
      const listing = { ...publishedListing(), externalId: 'gid://shopify/Product/1' };
      const { sync, publisher, listings } = setup({
        action: ListingTargetAction.Delist,
        product: productDetail(),
        listing,
      });

      await sync.delist(deletedJob());

      expect(publisher.delist).toHaveBeenCalledWith(
        expect.anything(),
        'gid://shopify/Product/1',
        expect.objectContaining({ productId: PRODUCT_ID }),
      );
      expect(listings.markDelisted).toHaveBeenCalled();
    });
  });
});
