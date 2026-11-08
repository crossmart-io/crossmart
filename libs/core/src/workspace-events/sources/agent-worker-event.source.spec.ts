import type { AgentWorkerAction } from '@crossmart/database';
import { SortDirection } from '@crossmart/common';
import { AgentWorkerActionStatus } from '../../agent-worker/enums/agent-worker-action-status.enum.js';
import { AgentWorkerToolKind } from '../../agent-worker/enums/agent-worker-tool-kind.enum.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { WorkspaceEventRepository } from '../repositories/workspace-event.repository.js';
import { AgentWorkerEventSource } from './agent-worker-event.source.js';

const SINCE = new Date('2026-11-08T09:00:00.000Z');
const MADE = new Date('2026-11-08T10:00:00.000Z');
const DECIDED = new Date('2026-11-08T10:01:00.000Z');
const UNTIL = new Date('2026-11-08T10:02:00.000Z');

const APPROVED: AgentWorkerAction = {
  id: 'a-1',
  conversationId: 'conv-1',
  messageId: 'm-1',
  toolUseId: 'toolu_1',
  toolName: 'retry_store_listing',
  kind: AgentWorkerToolKind.Write,
  status: AgentWorkerActionStatus.Executing,
  input: { productId: 'p-1', connectionId: 'c-1' },
  risks: [],
  summary: 'Retry publishing: Mug on eBay',
  preview: null,
  result: null,
  resultIsError: false,
  untrustedWarning: false,
  decidedByUserId: 'u-1',
  decidedAt: DECIDED,
  executedAt: null,
  finishedAt: null,
  createdAt: MADE,
};

function setup() {
  const repository = {
    activeConversationIds: vi
      .fn<WorkspaceEventRepository['activeConversationIds']>()
      .mockResolvedValue(['conv-1']),
    agentActions: vi.fn<WorkspaceEventRepository['agentActions']>().mockResolvedValue([APPROVED]),
    failedTurns: vi.fn<WorkspaceEventRepository['failedTurns']>().mockResolvedValue([]),
  };
  const source = new AgentWorkerEventSource(repository as unknown as WorkspaceEventRepository);
  return { source, repository };
}

const scope = (viewerUserId: string | null) => ({
  workspaceId: 'ws-1',
  viewerUserId,
  permissions: new Set([WorkspacePermission.UseAgentWorker]),
});

describe('AgentWorkerEventSource', () => {
  it('reads the reader’s own conversations, the newest step first for the history', async () => {
    const { source, repository } = setup();

    const events = await source.read(scope('u-1'), {
      after: null,
      since: SINCE,
      until: UNTIL,
      limit: 10,
    });

    expect(repository.activeConversationIds).toHaveBeenCalledWith('ws-1', 'u-1', SINCE);
    expect(repository.agentActions).toHaveBeenCalledWith(
      expect.objectContaining({ conversationIds: ['conv-1'], direction: SortDirection.Desc }),
    );
    expect(events.map(({ id }) => id)).toEqual(['agent:a-1:decided', 'agent:a-1:made']);
  });

  it('keeps only the steps after the cursor', async () => {
    const { source } = setup();
    const after = { occurredAt: MADE, id: 'agent:a-1:made' };

    const events = await source.read(scope('u-1'), { after, since: MADE, until: UNTIL, limit: 10 });

    expect(events.map(({ id }) => id)).toEqual(['agent:a-1:decided']);
  });

  it('shows nothing to an API key or an agent, whose conversations these are not', async () => {
    const { source, repository } = setup();

    expect(
      await source.read(scope(null), { after: null, since: SINCE, until: UNTIL, limit: 10 }),
    ).toEqual([]);
    expect(repository.activeConversationIds).not.toHaveBeenCalled();
  });
});
