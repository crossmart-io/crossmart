import { NotFoundException } from '@nestjs/common';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { CONNECTION_ID, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncProgressService } from './sync-progress.service.js';

function setup(pending: number, failed: number) {
  const connections = { require: vi.fn<SyncConnectionLoader['require']>() };
  const listings = {
    countSyncPending: vi.fn<ListingSyncRepository['countSyncPending']>().mockResolvedValue(pending),
    countFailed: vi.fn<ListingSyncRepository['countFailed']>().mockResolvedValue(failed),
  };
  const service = new SyncProgressService(
    connections as unknown as SyncConnectionLoader,
    listings as unknown as ListingSyncRepository,
  );
  return { service, connections, listings };
}

describe('SyncProgressService', () => {
  it('counts what is still queued and what failed, in the store only', async () => {
    const { service, listings } = setup(3, 1);

    const progress = await service.progress(WORKSPACE_ID, CONNECTION_ID);

    expect(progress).toEqual({ pending: 3, failed: 1, done: false });
    expect(listings.countSyncPending).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      connectionId: CONNECTION_ID,
    });
  });

  it('is done once nothing is pending, even with failures', async () => {
    const { service } = setup(0, 2);

    expect(await service.progress(WORKSPACE_ID, CONNECTION_ID)).toEqual({
      pending: 0,
      failed: 2,
      done: true,
    });
  });

  it('is not found for a store outside the workspace', async () => {
    const { service, connections, listings } = setup(0, 0);
    connections.require.mockRejectedValue(new NotFoundException());

    await expect(service.progress(WORKSPACE_ID, CONNECTION_ID)).rejects.toThrow(NotFoundException);
    expect(listings.countSyncPending).not.toHaveBeenCalled();
  });
});
