import { NotFoundException } from '@nestjs/common';
import { ChannelConnectorRegistry, type ChannelSession } from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import {
  CONNECTION_ID,
  connectionRecord,
  WORKSPACE_ID,
} from '../testing/channel-connection.fixtures.js';
import { FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import { ChannelConnectionsService } from './channel-connections.service.js';
import type { ChannelSessionFactory } from './channel-session.factory.js';

const actor = Actor.user('user-1');

function setup(otherActive = 0) {
  const connector = new FakeOAuthConnector();
  const session = { connectionId: CONNECTION_ID } as ChannelSession;
  const connections = {
    listForWorkspace: vi
      .fn<ChannelConnectionRepository['listForWorkspace']>()
      .mockResolvedValue([connectionRecord()]),
    findForWorkspace: vi
      .fn<ChannelConnectionRepository['findForWorkspace']>()
      .mockResolvedValue(connectionRecord()),
    countOtherActive: vi
      .fn<ChannelConnectionRepository['countOtherActive']>()
      .mockResolvedValue(otherActive),
    markDisconnected: vi
      .fn<ChannelConnectionRepository['markDisconnected']>()
      .mockResolvedValue(connectionRecord({ status: ChannelConnectionStatus.DISCONNECTED })),
  };
  const sessions = { open: vi.fn<ChannelSessionFactory['open']>().mockResolvedValue(session) };
  const activity = new InMemoryActivityRecorder();
  const service = new ChannelConnectionsService(
    connections as unknown as ChannelConnectionRepository,
    sessions as unknown as ChannelSessionFactory,
    new ChannelConnectorRegistry([connector]),
    activity,
  );
  return { service, connections, connector, activity, session };
}

describe('ChannelConnectionsService', () => {
  it('lists views with typed settings and no credentials', async () => {
    const { service } = setup();

    const [view] = await service.list(WORKSPACE_ID);

    expect(view.settings).toEqual({
      account: { channel: 'shopify' },
      productSelection: null,
      pricing: null,
    });
    expect(view).not.toHaveProperty('credentials');
  });

  it('404s a connection of another workspace', async () => {
    const { service, connections } = setup();
    connections.findForWorkspace.mockResolvedValueOnce(null);

    await expect(service.get('other', CONNECTION_ID)).rejects.toThrow(NotFoundException);
  });

  it('revokes access, wipes credentials and records the disconnect', async () => {
    const { service, connections, connector, activity, session } = setup();

    const view = await service.disconnect(WORKSPACE_ID, CONNECTION_ID, actor);

    expect(view.status).toBe(ChannelConnectionStatus.DISCONNECTED);
    expect(connector.revokeAccess).toHaveBeenCalledWith(session);
    expect(connections.markDisconnected).toHaveBeenCalledWith(CONNECTION_ID, expect.any(Date));
    expect(activity.recorded).toEqual([
      expect.objectContaining({
        actor,
        entry: expect.objectContaining({ action: ActivityAction.ChannelDisconnected }),
      }),
    ]);
  });

  it('keeps the app installed while another workspace uses the same store', async () => {
    const { service, connector, connections } = setup(1);

    await service.disconnect(WORKSPACE_ID, CONNECTION_ID, actor);

    expect(connector.revokeAccess).not.toHaveBeenCalled();
    expect(connections.markDisconnected).toHaveBeenCalled();
  });

  it('still wipes credentials when revocation fails, and ignores repeated disconnects', async () => {
    const { service, connector, connections, activity } = setup();
    connector.revokeAccess.mockRejectedValueOnce(new Error('network'));

    await service.disconnect(WORKSPACE_ID, CONNECTION_ID, actor);
    expect(connections.markDisconnected).toHaveBeenCalledTimes(1);

    connections.findForWorkspace.mockResolvedValueOnce(
      connectionRecord({ status: ChannelConnectionStatus.DISCONNECTED }),
    );
    await service.disconnect(WORKSPACE_ID, CONNECTION_ID, actor);
    expect(connections.markDisconnected).toHaveBeenCalledTimes(1);
    expect(activity.recorded).toHaveLength(1);
  });
});
