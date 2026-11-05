import { NotFoundException } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { AgentScope } from '../enums/agent-scope.enum.js';
import type {
  AgentConnectionRepository,
  AgentConsentRecord,
} from '../repositories/agent-connection.repository.js';
import { AgentConnectionsService } from './agent-connections.service.js';

const WORKSPACE_ID = 'ws-1';
const CONNECTED_AT = new Date('2026-11-05T10:00:00Z');

function record(id: string, userId: string): AgentConsentRecord {
  return {
    id,
    clientId: 'https://claude.ai/oauth/client.json',
    userId,
    referenceId: WORKSPACE_ID,
    scopes: ['catalog:read', 'offline_access'],
    createdAt: CONNECTED_AT,
    client: { name: 'Claude', uri: 'https://claude.ai', icon: null, disabled: false },
    user: { name: 'Dana', email: 'dana@example.com' },
  } as AgentConsentRecord;
}

function setup(records: AgentConsentRecord[]) {
  const connections = {
    list: vi.fn().mockResolvedValue(records),
    findById: vi.fn().mockResolvedValue(records[0] ?? null),
    revoke: vi.fn().mockResolvedValue(undefined),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new AgentConnectionsService(
    connections as unknown as AgentConnectionRepository,
    activity,
  );
  return { service, connections, activity };
}

describe('AgentConnectionsService', () => {
  it('lists only the viewer’s own connections unless they manage everyone’s', async () => {
    const { service, connections } = setup([record('c-1', 'user-1')]);

    const own = await service.list(WORKSPACE_ID, { userId: 'user-1', managesAll: false });
    await service.list(WORKSPACE_ID, { userId: 'user-1', managesAll: true });

    expect(own).toEqual([
      expect.objectContaining({ clientName: 'Claude', scopes: [AgentScope.CatalogRead] }),
    ]);
    expect(connections.list.mock.calls).toEqual([
      [WORKSPACE_ID, 'user-1'],
      [WORKSPACE_ID, undefined],
    ]);
  });

  it('revokes the viewer’s connection and logs it', async () => {
    const { service, connections, activity } = setup([record('c-1', 'user-1')]);

    await service.revoke(
      WORKSPACE_ID,
      'c-1',
      { userId: 'user-1', managesAll: false },
      Actor.user('user-1'),
    );

    expect(connections.revoke).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        clientId: 'https://claude.ai/oauth/client.json',
        workspaceId: WORKSPACE_ID,
      },
      expect.any(Date),
    );
    expect(activity.entries[0]?.action).toBe(ActivityAction.AgentDisconnected);
  });

  it('hides another member’s connection from someone who does not manage them', async () => {
    const { service, connections } = setup([record('c-1', 'user-2')]);

    await expect(
      service.revoke(
        WORKSPACE_ID,
        'c-1',
        { userId: 'user-1', managesAll: false },
        Actor.user('user-1'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(connections.revoke).not.toHaveBeenCalled();
  });
});
