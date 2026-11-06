import { ConflictException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingRetryErrorCode } from '../enums/listing-retry-error-code.enum.js';
import { RETRY_NEEDS_CONNECTION, RETRY_NEEDS_SELECTION } from '../listings.constants.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  CONNECTION_ID,
  connectionView,
  LISTING_ID,
  listingRecord,
  PRODUCT_ID,
  productDetail,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import type { ActiveListingsGate } from './active-listings.gate.js';
import { ListingRequeuer } from './listing-requeuer.js';
import { ListingRetryService } from './listing-retry.service.js';
import type { ProductSelectionService } from './product-selection.service.js';
import type { SyncJobQueue } from './sync-job.queue.js';
import { SyncRequestQueue } from './sync-request.queue.js';
import type { SyncProductLoader } from './sync-product.loader.js';

const ACTOR = Actor.user('user-1');
const TARGET = { workspaceId: WORKSPACE_ID, productId: PRODUCT_ID, connectionId: CONNECTION_ID };

function setup() {
  const connections = {
    get: vi.fn<ChannelConnectionsService['get']>().mockResolvedValue(connectionView()),
  };
  const products = {
    find: vi.fn<SyncProductLoader['find']>().mockResolvedValue(productDetail()),
  };
  const selection = {
    includes: vi.fn<ProductSelectionService['includes']>().mockResolvedValue(true),
  };
  const listings = {
    ensurePrimary: vi
      .fn<ListingSyncRepository['ensurePrimary']>()
      .mockResolvedValue(listingRecord()),
    markForRetry: vi.fn<ListingSyncRepository['markForRetry']>().mockResolvedValue(),
    markSyncRequested: vi.fn<ListingSyncRepository['markSyncRequested']>().mockResolvedValue(),
  };
  const gate = { assertRoomFor: vi.fn<ActiveListingsGate['assertRoomFor']>().mockResolvedValue() };
  const queue = { enqueue: vi.fn<SyncJobQueue['enqueue']>().mockResolvedValue() };
  const activity = new InMemoryActivityRecorder();
  const requeuer = new ListingRequeuer(
    listings as unknown as ListingSyncRepository,
    gate as unknown as ActiveListingsGate,
    new SyncRequestQueue(
      listings as unknown as ListingSyncRepository,
      queue as unknown as SyncJobQueue,
    ),
    activity,
  );
  const service = new ListingRetryService(
    connections as unknown as ChannelConnectionsService,
    products as unknown as SyncProductLoader,
    selection as unknown as ProductSelectionService,
    requeuer,
  );
  return { service, connections, products, selection, listings, gate, queue, activity };
}

describe('ListingRetryService', () => {
  it('marks the listing pending, queues its publish and stock, and logs the retry', async () => {
    const { service, listings, queue, activity } = setup();

    await service.retry(TARGET, ACTOR);

    expect(listings.ensurePrimary).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, PRODUCT_ID);
    expect(listings.markForRetry).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      listingId: LISTING_ID,
    });
    expect(listings.markSyncRequested).toHaveBeenCalledWith(
      { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID },
      [PRODUCT_ID],
      expect.any(Date),
    );
    expect(listings.markSyncRequested.mock.invocationCallOrder[0]).toBeLessThan(
      queue.enqueue.mock.invocationCallOrder[0] ?? 0,
    );
    expect(queue.enqueue).toHaveBeenCalledWith([
      { kind: SyncJobKind.Content, ...TARGET },
      { kind: SyncJobKind.Inventory, ...TARGET },
    ]);
    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.ListingRetryRequested,
        subject: expect.objectContaining({ id: PRODUCT_ID, label: 'Mug' }),
        detail: 'Demo Store',
      }),
    ]);
  });

  it.each([
    ChannelConnectionStatus.NEEDS_REAUTH,
    ChannelConnectionStatus.DISCONNECTED,
    ChannelConnectionStatus.ERROR,
  ])('refuses (409) a store that is %s, and queues nothing', async (status) => {
    const { service, connections, queue } = setup();
    connections.get.mockResolvedValue(connectionView({ status }));

    const retrying = service.retry(TARGET, ACTOR);

    await expect(retrying).rejects.toMatchObject({
      code: ListingRetryErrorCode.StoreNotConnected,
      message: RETRY_NEEDS_CONNECTION,
    });
    await expect(retrying).rejects.toBeInstanceOf(ConflictException);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('refuses (409) a product the store does not select', async () => {
    const { service, selection, listings } = setup();
    selection.includes.mockResolvedValue(false);

    await expect(service.retry(TARGET, ACTOR)).rejects.toMatchObject({
      code: ListingRetryErrorCode.ProductNotInStore,
      message: RETRY_NEEDS_SELECTION,
    });
    expect(listings.ensurePrimary).not.toHaveBeenCalled();
  });

  it('answers 404 for a product outside the workspace', async () => {
    const { service, products } = setup();
    products.find.mockResolvedValue(null);

    await expect(service.retry(TARGET, ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('changes nothing when the plan has no room for another active listing', async () => {
    const { service, gate, listings, queue, activity } = setup();
    gate.assertRoomFor.mockRejectedValueOnce(planLimitReached(Feature.ActiveListings));

    await expect(service.retry(TARGET, ACTOR)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });
    expect(gate.assertRoomFor).toHaveBeenCalledWith(
      { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID },
      { workspaceId: WORKSPACE_ID, id: PRODUCT_ID },
    );
    expect(listings.ensurePrimary).not.toHaveBeenCalled();
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(activity.entries).toHaveLength(0);
  });
});
