import { PublishRequirement } from '@crossmart/connectors';
import { NotFoundException } from '@nestjs/common';
import { ListingStatus, type PrismaService } from '@crossmart/database';
import { WebhookEventType } from '../../webhooks/enums/webhook-event-type.enum.js';
import { RecordingWebhookOutbox } from '../../webhooks/testing/recording-webhook-outbox.js';
import { ListingSyncRepository } from './listing-sync.repository.js';
import { ListingWebhookEvents } from './listing-webhook-events.js';

const LISTING = { workspaceId: 'ws-1', listingId: 'listing-1' };

const LISTING_ROW = {
  id: 'listing-1',
  productId: 'p-1',
  connectionId: 'conn-1',
  status: ListingStatus.ERROR,
  externalId: null,
  externalUrl: null,
  lastError: 'Slow down',
  connection: { channel: 'shopify' },
};

function setup(updated: number) {
  const listing = {
    updateMany: vi.fn(() => Promise.resolve({ count: updated })),
    findFirst: vi.fn(() => Promise.resolve(LISTING_ROW)),
  };
  const listingVariant = {
    deleteMany: vi.fn(() => Promise.resolve({ count: 0 })),
    createMany: vi.fn(() => Promise.resolve({ count: 0 })),
  };
  const tx = { listing, listingVariant };
  const prisma = {
    listing,
    $transaction: (work: (client: typeof tx) => Promise<void>) => work(tx),
  };
  const outbox = new RecordingWebhookOutbox();
  const repository = new ListingSyncRepository(
    prisma as unknown as PrismaService,
    new ListingWebhookEvents(outbox),
  );
  return { repository, listing, listingVariant, outbox };
}

describe('ListingSyncRepository writes', () => {
  it('updates the listing only within its workspace', async () => {
    const { repository, listing } = setup(1);

    await repository.recordFailure(LISTING, 'Slow down', ListingStatus.ERROR);

    expect(listing.updateMany).toHaveBeenCalledWith({
      where: { id: 'listing-1', workspaceId: 'ws-1' },
      data: { lastError: 'Slow down', status: ListingStatus.ERROR, missingRequirement: null },
    });
  });

  it('keeps what a refused publish lacked, and leaves it alone for a retryable failure', async () => {
    const { repository, listing } = setup(1);

    await repository.recordFailure(
      LISTING,
      'Add item specifics',
      ListingStatus.ERROR,
      PublishRequirement.ItemSpecifics,
    );
    await repository.recordFailure(LISTING, 'Slow down');

    expect(listing.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'listing-1', workspaceId: 'ws-1' },
      data: {
        lastError: 'Add item specifics',
        status: ListingStatus.ERROR,
        missingRequirement: PublishRequirement.ItemSpecifics,
      },
    });
    expect(listing.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'listing-1', workspaceId: 'ws-1' },
      data: { lastError: 'Slow down' },
    });
  });

  it('sends listing.failed only for a failure that puts the listing in error', async () => {
    const { repository, outbox } = setup(1);

    await repository.recordFailure(LISTING, 'Slow down');
    await repository.recordFailure(LISTING, 'Rejected', ListingStatus.ERROR);

    expect(outbox.published).toEqual([
      {
        workspaceId: 'ws-1',
        type: WebhookEventType.ListingFailed,
        data: { listing: { ...LISTING_ROW, connection: undefined, channel: 'shopify' } },
      },
    ]);
  });

  it('sends listing.published for a first publish and listing.removed for a delist', async () => {
    const { repository, outbox } = setup(1);
    const published = {
      externalId: 'ext',
      externalUrl: null,
      status: ListingStatus.ACTIVE,
      variants: [],
      mediaDigest: 'digest',
      syncedAt: new Date(),
    };

    await repository.recordPublished(LISTING, { ...published, newlyPublished: false });
    await repository.recordPublished(LISTING, { ...published, newlyPublished: true });
    await repository.markDelisted(LISTING, new Date());

    expect(outbox.published.map((event) => event.type)).toEqual([
      WebhookEventType.ListingPublished,
      WebhookEventType.ListingRemoved,
    ]);
  });

  it('withdraws a listing the channel never received, without sending listing.removed', async () => {
    const { repository, listing, outbox } = setup(1);

    await repository.markWithdrawn(LISTING);

    expect(listing.updateMany).toHaveBeenCalledWith({
      where: { id: 'listing-1', workspaceId: 'ws-1' },
      data: { status: ListingStatus.DELISTED, lastError: null, missingRequirement: null },
    });
    expect(outbox.published).toEqual([]);
  });

  it('queues a failed or delisted listing for a retry, clearing its error', async () => {
    const { repository, listing } = setup(1);

    await repository.markForRetry(LISTING);

    expect(listing.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'listing-1',
        workspaceId: 'ws-1',
        status: { in: [ListingStatus.ERROR, ListingStatus.DELISTED] },
      },
      data: { status: ListingStatus.PENDING, lastError: null, missingRequirement: null },
    });
  });

  it('is not found when the listing is not in the workspace', async () => {
    const { repository } = setup(0);

    await expect(repository.recordSynced(LISTING, new Date())).rejects.toThrow(NotFoundException);
    await expect(repository.markDelisted(LISTING, new Date())).rejects.toThrow(NotFoundException);
  });

  it('replaces the variant mappings of a publish within the workspace, after the listing', async () => {
    const { repository, listingVariant } = setup(1);
    const variants = [{ variantId: 'v-1', externalId: 'ext-1', externalInventoryId: null }];

    await repository.recordPublished(LISTING, {
      externalId: 'ext',
      externalUrl: null,
      status: ListingStatus.ACTIVE,
      variants,
      mediaDigest: 'digest',
      syncedAt: new Date(),
      newlyPublished: true,
    });

    expect(listingVariant.deleteMany).toHaveBeenCalledWith({
      where: { listingId: 'listing-1', workspaceId: 'ws-1' },
    });
    expect(listingVariant.createMany).toHaveBeenCalledWith({
      data: [{ ...variants[0], listingId: 'listing-1', workspaceId: 'ws-1' }],
    });
  });

  it('writes no variant mappings for a listing outside the workspace', async () => {
    const { repository, listingVariant } = setup(0);

    await expect(
      repository.recordPublished(LISTING, {
        externalId: 'ext',
        externalUrl: null,
        status: ListingStatus.ACTIVE,
        variants: [],
        mediaDigest: 'digest',
        syncedAt: new Date(),
        newlyPublished: true,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(listingVariant.deleteMany).not.toHaveBeenCalled();
  });

  it('marks a sync request on the products’ listings of one store, and clears it per product', async () => {
    const { repository, listing } = setup(2);
    const scope = { workspaceId: 'ws-1', connectionId: 'conn-1' };
    const requestedAt = new Date('2026-11-10T10:00:00Z');

    await repository.markSyncRequested(scope, ['p-1', 'p-2'], requestedAt);
    await repository.clearSyncRequest(scope, 'p-1');

    expect(listing.updateMany).toHaveBeenNthCalledWith(1, {
      where: { ...scope, productId: { in: ['p-1', 'p-2'] } },
      data: { syncRequestedAt: requestedAt },
    });
    expect(listing.updateMany).toHaveBeenNthCalledWith(2, {
      where: { ...scope, productId: 'p-1', syncRequestedAt: { not: null } },
      data: { syncRequestedAt: null },
    });
  });
});
