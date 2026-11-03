import { BadRequestException } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import type { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { CONNECTION_ID, connectionView, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { ConnectionRulesService } from './connection-rules.service.js';
import { StoreMembershipService } from './store-membership.service.js';
import { StoreMembershipWriter } from './store-membership.writer.js';
import type { SyncJobQueue } from './sync-job.queue.js';

const ACTOR = Actor.user('user-1');
const MUG = { id: 'p-mug', title: 'Mug' };
const CUP = { id: 'p-cup', title: 'Cup' };
const change = (productIds: string[]) => ({
  workspaceId: WORKSPACE_ID,
  connectionId: CONNECTION_ID,
  productIds,
});

function setup(found = [MUG, CUP]) {
  const connections = {
    get: vi.fn<ChannelConnectionsService['get']>().mockResolvedValue(connectionView()),
  };
  const products = {
    findTitles: vi.fn<ProductSelectionRepository['findTitles']>().mockResolvedValue(found),
  };
  const listings = {
    addToStore: vi.fn<ListingSyncRepository['addToStore']>().mockResolvedValue(),
    releaseFromStore: vi.fn<ListingSyncRepository['releaseFromStore']>().mockResolvedValue(),
  };
  const rules = {
    changeExclusions: vi.fn<ConnectionRulesService['changeExclusions']>().mockResolvedValue(),
  };
  const queue = { enqueue: vi.fn<SyncJobQueue['enqueue']>().mockResolvedValue() };
  const activity = new InMemoryActivityRecorder();
  const writer = new StoreMembershipWriter(
    listings as unknown as ListingSyncRepository,
    rules as unknown as ConnectionRulesService,
    queue as unknown as SyncJobQueue,
  );
  const service = new StoreMembershipService(
    connections as unknown as ChannelConnectionsService,
    products as unknown as ProductSelectionRepository,
    writer,
    activity,
  );
  return { service, listings, rules, queue, activity };
}

describe('StoreMembershipService', () => {
  it('adds products by hand, restores them, publishes them with stock and logs each', async () => {
    const { service, listings, rules, queue, activity } = setup();

    await service.add(change([MUG.id, CUP.id]), ACTOR);

    expect(listings.addToStore).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, [MUG.id, CUP.id]);
    expect(rules.changeExclusions).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, {
      restore: [MUG.id, CUP.id],
    });
    expect(queue.enqueue.mock.calls[0]?.[0].map((job) => [job.productId, job.kind])).toEqual([
      [MUG.id, SyncJobKind.Content],
      [MUG.id, SyncJobKind.Inventory],
      [CUP.id, SyncJobKind.Content],
      [CUP.id, SyncJobKind.Inventory],
    ]);
    expect(activity.entries.map((entry) => [entry.action, entry.subject?.label])).toEqual([
      [ActivityAction.ListingAdded, 'Mug'],
      [ActivityAction.ListingAdded, 'Cup'],
    ]);
  });

  it('removes products by hand, keeps the rule from adding them back, and delists them', async () => {
    const { service, listings, rules, queue, activity } = setup([MUG]);

    await service.remove(change([MUG.id]), ACTOR);

    expect(listings.releaseFromStore).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, [MUG.id]);
    expect(rules.changeExclusions).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, {
      exclude: [MUG.id],
    });
    expect(queue.enqueue).toHaveBeenCalledWith([
      expect.objectContaining({ productId: MUG.id, kind: SyncJobKind.Delist }),
    ]);
    expect(activity.entries[0]).toMatchObject({ action: ActivityAction.ListingRemoved });
  });

  it('refuses products of another workspace, and changes nothing', async () => {
    const { service, listings, queue } = setup([MUG]);

    await expect(service.add(change([MUG.id, 'p-foreign']), ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(listings.addToStore).not.toHaveBeenCalled();
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});
