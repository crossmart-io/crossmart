import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import type { ApiToolResult, ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { AgentWorkerActionRisk } from '../../agent-worker/enums/agent-worker-action-risk.enum.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import {
  AgentProposalForbiddenError,
  AgentProposalNotFoundError,
  AgentProposalNotPendingError,
  AgentProposalRiskNotConfirmedError,
} from '../errors/agent-proposal.errors.js';
import {
  InMemoryAgentProposalRepository,
  proposalRecord,
  REVIEWER_ID,
  WORKSPACE_ID,
} from '../testing/agent-proposal.fixtures.js';
import { AgentProposalDecisions } from './agent-proposal-decisions.js';
import { AgentProposalExecutor } from './agent-proposal-executor.js';
import type { AgentProposalGrant } from './agent-proposal-token.service.js';

class FakeExecutor extends AgentProposalExecutor {
  readonly grants: AgentProposalGrant[] = [];
  answer: ApiToolResult = { isError: false, text: '{"id":"p"}' };
  failure: Error | null = null;

  execute(grant: AgentProposalGrant, _spec: ApiToolSpec): Promise<ApiToolResult> {
    this.grants.push(grant);
    return this.failure ? Promise.reject(this.failure) : Promise.resolve(this.answer);
  }
}

const EDITOR = {
  userId: REVIEWER_ID,
  permissions: new Set([WorkspacePermission.EditProducts, WorkspacePermission.ApproveSuggestions]),
};

function setup(overrides: Parameters<typeof proposalRecord>[0] = {}) {
  const repository = new InMemoryAgentProposalRepository();
  const record = proposalRecord(overrides);
  repository.records.push(record);
  const executor = new FakeExecutor();
  const activity = new InMemoryActivityRecorder();
  const decisions = new AgentProposalDecisions(repository.asRepository(), executor, activity);
  return { record, executor, activity, decisions };
}

describe('AgentProposalDecisions', () => {
  it('applies an approved proposal as its agent, approved by the reviewer', async () => {
    const { record, executor, decisions } = setup();
    const view = await decisions.approve(WORKSPACE_ID, record.id, EDITOR, false);

    expect(executor.grants).toEqual([
      { workspaceId: WORKSPACE_ID, proposalId: record.id, approvedByUserId: REVIEWER_ID },
    ]);
    expect(view).toMatchObject({ status: AgentProposalStatus.Applied, isError: false });
    expect(view.decidedByName).toBe('Lee');
  });

  it('records a refusal as a failed proposal', async () => {
    const { record, executor, decisions } = setup();
    executor.answer = { isError: true, text: 'Crossmart refused (403): no', status: 403 };
    const view = await decisions.approve(WORKSPACE_ID, record.id, EDITOR, false);

    expect(view).toMatchObject({ status: AgentProposalStatus.Failed, isError: true });
    expect(view.result).toContain('refused');
  });

  it('treats an unreachable API as a failed change', async () => {
    const { record, executor, decisions } = setup();
    executor.failure = new Error('ECONNREFUSED');
    const view = await decisions.approve(WORKSPACE_ID, record.id, EDITOR, false);

    expect(view.status).toBe(AgentProposalStatus.Failed);
  });

  it('needs an explicit confirmation for a risky change', async () => {
    const { record, executor, decisions } = setup({ risks: [AgentWorkerActionRisk.PriceChange] });

    await expect(decisions.approve(WORKSPACE_ID, record.id, EDITOR, false)).rejects.toThrow(
      AgentProposalRiskNotConfirmedError,
    );
    expect(executor.grants).toHaveLength(0);
    await expect(decisions.approve(WORKSPACE_ID, record.id, EDITOR, true)).resolves.toMatchObject({
      status: AgentProposalStatus.Applied,
    });
  });

  it('refuses a reviewer who could not make the change themselves', async () => {
    const { record, decisions } = setup();
    const viewer = {
      userId: REVIEWER_ID,
      permissions: new Set([WorkspacePermission.ApproveSuggestions]),
    };
    await expect(decisions.approve(WORKSPACE_ID, record.id, viewer, false)).rejects.toThrow(
      AgentProposalForbiddenError,
    );
  });

  it('decides once: a second approval, or one after expiry, is a conflict', async () => {
    const { record, decisions } = setup();
    await decisions.approve(WORKSPACE_ID, record.id, EDITOR, false);
    await expect(decisions.approve(WORKSPACE_ID, record.id, EDITOR, false)).rejects.toThrow(
      AgentProposalNotPendingError,
    );

    const expired = setup({ expiresAt: new Date(Date.now() - 1) });
    await expect(expired.decisions.reject(WORKSPACE_ID, expired.record.id, EDITOR)).rejects.toThrow(
      AgentProposalNotPendingError,
    );
  });

  it('records a rejection in the activity log, naming the agent', async () => {
    const { record, activity, executor, decisions } = setup();
    const view = await decisions.reject(WORKSPACE_ID, record.id, EDITOR);

    expect(view.status).toBe(AgentProposalStatus.Rejected);
    expect(executor.grants).toHaveLength(0);
    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.AgentProposalRejected,
        detail: 'from Claude',
      }),
    ]);
    expect(activity.recorded[0]?.actor.userId).toBe(REVIEWER_ID);
  });

  it('answers 404 for a proposal of another workspace', async () => {
    const { record, decisions } = setup();
    await expect(decisions.reject('another-workspace', record.id, EDITOR)).rejects.toThrow(
      AgentProposalNotFoundError,
    );
  });
});
