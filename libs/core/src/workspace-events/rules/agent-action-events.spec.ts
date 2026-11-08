import type { AgentWorkerAction, AgentWorkerTurn } from '@crossmart/database';
import { AgentWorkerActionStatus } from '../../agent-worker/enums/agent-worker-action-status.enum.js';
import { AgentWorkerToolKind } from '../../agent-worker/enums/agent-worker-tool-kind.enum.js';
import { AgentWorkerTurnStatus } from '../../agent-worker/enums/agent-worker-turn-status.enum.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { agentActionEvents, failedTurnEvent } from './agent-action-events.js';

const MADE = new Date('2026-11-08T10:00:00.000Z');
const DECIDED = new Date('2026-11-08T10:01:00.000Z');
const FINISHED = new Date('2026-11-08T10:01:02.000Z');

function action(overrides: Partial<AgentWorkerAction> = {}): AgentWorkerAction {
  return {
    id: 'a-1',
    conversationId: 'conv-1',
    messageId: 'm-1',
    toolUseId: 'toolu_1',
    toolName: 'update_variant_price',
    kind: AgentWorkerToolKind.Write,
    status: AgentWorkerActionStatus.Proposed,
    input: { productId: 'p-1', connectionId: 'c-1', price: '19.00' },
    risks: [],
    summary: 'Change a price: Mug on Outlet',
    preview: null,
    result: null,
    resultIsError: false,
    untrustedWarning: false,
    decidedByUserId: null,
    decidedAt: null,
    executedAt: null,
    finishedAt: null,
    createdAt: MADE,
    ...overrides,
  };
}

describe('agentActionEvents', () => {
  it('shows a change waiting for approval, on the store and product it names', () => {
    expect(agentActionEvents(action())).toEqual([
      expect.objectContaining({
        id: 'agent:a-1:made',
        type: WorkspaceEventType.AgentChangeProposed,
        summary: 'Proposed: Change a price: Mug on Outlet',
        refs: { connectionId: 'c-1', productId: 'p-1', conversationId: 'conv-1', actionId: 'a-1' },
        occurredAt: MADE,
      }),
    ]);
  });

  it('follows an approved change to the moment it is applied', () => {
    const applied = action({
      status: AgentWorkerActionStatus.Executed,
      decidedAt: DECIDED,
      executedAt: FINISHED,
      finishedAt: FINISHED,
    });
    expect(agentActionEvents(applied).map(({ type, occurredAt }) => [type, occurredAt])).toEqual([
      [WorkspaceEventType.AgentChangeProposed, MADE],
      [WorkspaceEventType.AgentChangeApproved, DECIDED],
      [WorkspaceEventType.AgentChangeApplied, FINISHED],
    ]);
  });

  it('reports a refused approval with the API’s reason, and a rejection or a drop', () => {
    const refused = action({
      status: AgentWorkerActionStatus.ExecutionFailed,
      decidedAt: DECIDED,
      finishedAt: FINISHED,
      result: 'Requires the products:edit permission\nmore',
    });
    expect(agentActionEvents(refused).at(-1)).toMatchObject({
      type: WorkspaceEventType.AgentChangeFailed,
      detail: 'Requires the products:edit permission',
    });
    const rejected = action({ status: AgentWorkerActionStatus.Rejected, decidedAt: DECIDED });
    const expired = action({ status: AgentWorkerActionStatus.Expired, decidedAt: DECIDED });
    expect(agentActionEvents(rejected).at(-1)?.summary).toBe(
      'Rejected: Change a price: Mug on Outlet',
    );
    expect(agentActionEvents(expired).at(-1)?.type).toBe(WorkspaceEventType.AgentChangeRejected);
  });

  it('shows a read once it answered, with what it found', () => {
    const read = action({
      kind: AgentWorkerToolKind.Read,
      toolName: 'list_store_products',
      summary: 'List a store’s products by state',
      status: AgentWorkerActionStatus.Succeeded,
      input: { connectionId: 'c-1', state: 'failed' },
      result: JSON.stringify({ items: [1, 2, 3] }),
      finishedAt: FINISHED,
    });
    expect(agentActionEvents(read)).toEqual([
      expect.objectContaining({
        id: 'agent:a-1:finished',
        type: WorkspaceEventType.AgentToolCalled,
        detail: '3 found',
        failed: false,
      }),
    ]);
    expect(
      agentActionEvents({ ...read, status: AgentWorkerActionStatus.Running, finishedAt: null }),
    ).toEqual([]);
  });

  it('turns a refused proposal into a failure', () => {
    const refused = action({ status: AgentWorkerActionStatus.Refused, result: 'Not allowed' });
    expect(agentActionEvents(refused)[0]).toMatchObject({
      type: WorkspaceEventType.AgentChangeFailed,
      detail: 'Not allowed',
    });
  });
});

describe('failedTurnEvent', () => {
  const turn: AgentWorkerTurn = {
    id: 't-1',
    conversationId: 'conv-1',
    trigger: 'message',
    status: AgentWorkerTurnStatus.Failed,
    model: null,
    modelCalls: 1,
    inputTokens: 0,
    outputTokens: 0,
    failureReason: 'Crossmart Agent could not finish. Try again in a moment.',
    cancelRequestedAt: null,
    startedAt: MADE,
    finishedAt: FINISHED,
  };

  it('says why the turn failed, once it ended', () => {
    expect(failedTurnEvent(turn)).toMatchObject({
      type: WorkspaceEventType.AgentTurnFailed,
      detail: turn.failureReason,
      occurredAt: FINISHED,
    });
    expect(failedTurnEvent({ ...turn, finishedAt: null })).toBeNull();
  });
});
