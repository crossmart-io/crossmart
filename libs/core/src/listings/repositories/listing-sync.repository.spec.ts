import { NotFoundException } from '@nestjs/common';
import { ListingStatus, type PrismaService } from '@crossmart/database';
import { ListingSyncRepository } from './listing-sync.repository.js';

const LISTING = { workspaceId: 'ws-1', listingId: 'listing-1' };

function setup(updated: number) {
  const listing = { updateMany: vi.fn(() => Promise.resolve({ count: updated })) };
  const listingVariant = {
    deleteMany: vi.fn(() => Promise.resolve({ count: 0 })),
    createMany: vi.fn(() => Promise.resolve({ count: 0 })),
  };
  const tx = { listing, listingVariant };
  const prisma = {
    listing,
    $transaction: (work: (client: typeof tx) => Promise<void>) => work(tx),
  };
  const repository = new ListingSyncRepository(prisma as unknown as PrismaService);
  return { repository, listing, listingVariant };
}

describe('ListingSyncRepository writes', () => {
  it('updates the listing only within its workspace', async () => {
    const { repository, listing } = setup(1);

    await repository.recordFailure(LISTING, 'Slow down', ListingStatus.ERROR);

    expect(listing.updateMany).toHaveBeenCalledWith({
      where: { id: 'listing-1', workspaceId: 'ws-1' },
      data: { lastError: 'Slow down', status: ListingStatus.ERROR },
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
      }),
    ).rejects.toThrow(NotFoundException);
    expect(listingVariant.deleteMany).not.toHaveBeenCalled();
  });
});
