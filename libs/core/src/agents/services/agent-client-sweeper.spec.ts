import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import type { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { AGENT_CLIENT_SWEEP_BATCH_SIZE } from '../agents.constants.js';
import type { StaleAgentClient } from '../entities/agent-client-sweep.js';
import type { AgentClientRepository } from '../repositories/agent-client.repository.js';
import { AgentClientSweeper } from './agent-client-sweeper.js';

const NOW = new Date('2026-11-05T12:00:00Z');
const DAY_AGO = new Date('2026-11-04T12:00:00Z');
const NINETY_DAYS_AGO = new Date('2026-08-07T12:00:00Z');

const CLAUDE: StaleAgentClient = {
  clientId: 'https://claude.ai/oauth/client.json',
  name: 'Claude',
};
const CURSOR: StaleAgentClient = { clientId: 'dcr-1', name: 'Cursor' };

function setup(staleBatches: StaleAgentClient[][] = []) {
  const clients = {
    deleteUnusedRegistrations: vi.fn().mockResolvedValue(3),
    findStale: vi.fn(),
    findWorkspacesActedIn: vi.fn().mockResolvedValue([]),
    deleteStale: vi.fn((batch: StaleAgentClient[]) => Promise.resolve(batch.length)),
  };
  for (const batch of staleBatches) clients.findStale.mockResolvedValueOnce(batch);
  clients.findStale.mockResolvedValue([]);
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const sweeper = new AgentClientSweeper(
    clients as unknown as AgentClientRepository,
    activity as unknown as ActivityRecorder,
  );
  return { clients, activity, sweeper };
}

describe('AgentClientSweeper', () => {
  it('deletes registrations never used within a day', async () => {
    const { clients, sweeper } = setup();

    await expect(sweeper.sweep(NOW)).resolves.toEqual({ neverUsed: 3, stale: 0 });
    expect(clients.deleteUnusedRegistrations).toHaveBeenCalledWith(DAY_AGO);
  });

  it('deletes clients nobody used for 90 days, checking them again as it deletes', async () => {
    const { clients, sweeper } = setup([[CLAUDE, CURSOR]]);

    await expect(sweeper.sweep(NOW)).resolves.toEqual({ neverUsed: 3, stale: 2 });
    expect(clients.findStale).toHaveBeenCalledWith(
      NINETY_DAYS_AGO,
      NOW,
      AGENT_CLIENT_SWEEP_BATCH_SIZE,
    );
    expect(clients.deleteStale).toHaveBeenCalledWith(
      [CLAUDE, CURSOR],
      new Set(),
      NINETY_DAYS_AGO,
      NOW,
    );
  });

  it('works in batches until a batch comes back short', async () => {
    const fullBatch = Array.from({ length: AGENT_CLIENT_SWEEP_BATCH_SIZE }, (_, index) => ({
      clientId: `dcr-${index}`,
      name: `Agent ${index}`,
    }));
    const { clients, sweeper } = setup([fullBatch, [CURSOR]]);

    await expect(sweeper.sweep(NOW)).resolves.toMatchObject({
      stale: AGENT_CLIENT_SWEEP_BATCH_SIZE + 1,
    });
    expect(clients.findStale).toHaveBeenCalledTimes(2);
  });

  it('records one event per workspace the removed agents worked in, and keeps their names', async () => {
    const { clients, activity, sweeper } = setup([[CLAUDE, CURSOR]]);
    clients.findWorkspacesActedIn.mockResolvedValue([
      { clientId: CLAUDE.clientId, workspaceId: 'ws-1' },
      { clientId: CURSOR.clientId, workspaceId: 'ws-1' },
      { clientId: CLAUDE.clientId, workspaceId: 'ws-2' },
    ]);

    await sweeper.sweep(NOW);

    expect(clients.deleteStale).toHaveBeenCalledWith(
      [CLAUDE, CURSOR],
      new Set([CLAUDE.clientId, CURSOR.clientId]),
      NINETY_DAYS_AGO,
      NOW,
    );
    expect(activity.record).toHaveBeenCalledTimes(2);
    expect(activity.record).toHaveBeenCalledWith('ws-1', Actor.system(), {
      action: ActivityAction.UnusedAgentsRemoved,
      itemCount: 2,
      detail: 'Claude, Cursor',
    });
    expect(activity.record).toHaveBeenCalledWith('ws-2', Actor.system(), {
      action: ActivityAction.UnusedAgentsRemoved,
      itemCount: 1,
      detail: 'Claude',
    });
  });

  it('records nothing when no stale client is left', async () => {
    const { clients, activity, sweeper } = setup();

    await sweeper.sweep(NOW);

    expect(clients.deleteStale).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });
});
