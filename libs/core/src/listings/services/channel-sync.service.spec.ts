import { BadRequestException } from '@nestjs/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  connectionView,
  syncConnection,
  syncJob,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ChannelSyncService } from './channel-sync.service.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';
import type { SyncPlanner } from './sync-planner.js';
import type { SyncRequestQueue } from './sync-request.queue.js';

const ACTOR = Actor.user('user-1');

function setup() {
  const connection = syncConnection({} as ConnectorDouble);
  const connections = {
    require: vi.fn<SyncConnectionLoader['require']>().mockResolvedValue(connection),
  };
  const plan = { publish: [syncJob()], delist: [syncJob(SyncJobKind.Delist)] };
  const planner = { plan: vi.fn<SyncPlanner['plan']>().mockResolvedValue(plan) };
  const requests = { enqueue: vi.fn<SyncRequestQueue['enqueue']>().mockResolvedValue() };
  const activity = new InMemoryActivityRecorder();
  const service = new ChannelSyncService(
    connections as unknown as SyncConnectionLoader,
    planner as unknown as SyncPlanner,
    requests as unknown as SyncRequestQueue,
    activity,
  );
  return { service, connections, requests, activity, plan, connection };
}

describe('ChannelSyncService', () => {
  it('queues the plan as a marked request, and logs it', async () => {
    const { service, requests, activity, plan } = setup();

    const result = await service.requestSync(WORKSPACE_ID, CONNECTION_ID, ACTOR);

    expect(result).toEqual({ queued: 1, delisting: 1 });
    expect(requests.enqueue).toHaveBeenCalledWith(
      { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID },
      [...plan.publish, ...plan.delist],
    );
    expect(activity.entries[0]?.action).toBe(ActivityAction.ChannelSyncRequested);
  });

  it('refuses a store that is not connected, and queues nothing', async () => {
    const { service, connections, requests, connection } = setup();
    connections.require.mockResolvedValue({
      ...connection,
      view: connectionView({ status: ChannelConnectionStatus.NEEDS_REAUTH }),
    });

    await expect(service.requestSync(WORKSPACE_ID, CONNECTION_ID, ACTOR)).rejects.toThrow(
      BadRequestException,
    );
    expect(requests.enqueue).not.toHaveBeenCalled();
  });
});
