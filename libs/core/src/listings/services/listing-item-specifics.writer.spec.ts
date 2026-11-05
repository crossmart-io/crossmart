import { ListingStatus } from '@crossmart/database';
import type { ListingItemSpecificsRepository } from '../repositories/listing-item-specifics.repository.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import {
  CONNECTION_ID,
  LISTING_ID,
  listingRecord,
  PRODUCT_ID,
  publishedListing,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ListingItemSpecificsWriter } from './listing-item-specifics.writer.js';
import type { SyncJobQueue } from './sync-job.queue.js';

const TARGET = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, productId: PRODUCT_ID };
const SPECIFICS = [{ name: 'Material', values: ['Stoneware'] }];

function setup(listing = listingRecord()) {
  const listings = {
    findPrimary: vi.fn<ListingSyncRepository['findPrimary']>().mockResolvedValue(listing),
    ensurePrimary: vi.fn<ListingSyncRepository['ensurePrimary']>().mockResolvedValue(listing),
  };
  const specifics = { replace: vi.fn<ListingItemSpecificsRepository['replace']>() };
  const queue = { enqueue: vi.fn<SyncJobQueue['enqueue']>().mockResolvedValue() };
  const writer = new ListingItemSpecificsWriter(
    listings as unknown as ListingSyncRepository,
    specifics as unknown as ListingItemSpecificsRepository,
    queue as unknown as SyncJobQueue,
  );
  return { writer, listings, specifics, queue };
}

describe('ListingItemSpecificsWriter', () => {
  it('reads the listing’s category and item specifics', async () => {
    const { writer } = setup(
      listingRecord({
        channelCategoryId: '20625',
        channelCategoryName: 'Mugs',
        itemSpecifics: SPECIFICS,
      }),
    );

    expect(await writer.current(TARGET)).toEqual({
      category: { id: '20625', name: 'Mugs' },
      values: SPECIFICS,
    });
  });

  it('saves on a pending listing without queueing an update', async () => {
    const { writer, specifics, queue } = setup();

    await writer.save(TARGET, SPECIFICS);

    expect(specifics.replace).toHaveBeenCalledWith(WORKSPACE_ID, LISTING_ID, SPECIFICS);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it.each([
    ['the channel holds the listing', publishedListing()],
    ['its last publish failed', listingRecord({ status: ListingStatus.ERROR })],
  ])('sends the listing again when %s', async (_case, listing) => {
    const { writer, queue } = setup(listing);

    await writer.save(TARGET, SPECIFICS);

    expect(queue.enqueue).toHaveBeenCalledWith([{ ...TARGET, kind: SyncJobKind.Content }]);
  });
});
