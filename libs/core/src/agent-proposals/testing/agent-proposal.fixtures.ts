import { randomUUID } from 'node:crypto';
import { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { AgentProposer } from '../entities/agent-proposer.js';
import type { AgentProposalListQuery } from '../entities/agent-proposal-views.js';
import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import { AgentProposerKind } from '../enums/agent-proposer-kind.enum.js';
import type {
  AgentProposalOutcomeRecord,
  AgentProposalRecord,
  NewAgentProposal,
} from '../repositories/agent-proposal.queries.js';
import type { AgentProposalRepository } from '../repositories/agent-proposal.repository.js';

export const WORKSPACE_ID = '0b6c1d4e-7f0a-4c55-9a39-3c1f4b7e9d01';
export const PRODUCT_ID = '6f1c7b0e-2d4a-4e3b-9a51-8c2d3e4f5a60';
export const VARIANT_ID = '7a2d8c1f-3e5b-4f4c-8b62-9d3e4f5a6b71';
export const USER_ID = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
export const REVIEWER_ID = '2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f60';
/** How long a fixture proposal still waits. */
const PENDING_FOR_MS = 60_000;
export const CLIENT_ID = 'https://claude.ai/oauth/claude-code-client-metadata';

/** Claude, connected with catalog scopes, acting for Dana. */
export function claudeProposer(overrides: Partial<AgentProposer> = {}): AgentProposer {
  return {
    kind: AgentProposerKind.OAuthAgent,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID,
    oauthClientId: CLIENT_ID,
    apiKeyId: null,
    agentName: 'Claude',
    scopes: [AgentScope.CatalogRead, AgentScope.CatalogWrite],
    permissions: new Set([WorkspacePermission.ViewProducts, WorkspacePermission.EditProducts]),
    ...overrides,
  };
}

export function proposalRecord(overrides: Partial<AgentProposalRecord> = {}): AgentProposalRecord {
  const now = new Date();
  return {
    id: randomUUID(),
    workspaceId: WORKSPACE_ID,
    proposerKind: AgentProposerKind.OAuthAgent,
    userId: USER_ID,
    oauthClientId: CLIENT_ID,
    apiKeyId: null,
    agentName: 'Claude',
    scopes: [AgentScope.CatalogWrite],
    toolName: 'update_product_text',
    input: { productId: PRODUCT_ID, title: 'Linen Shirt' },
    risks: [],
    summary: 'Change the title or description of a product',
    preview: null,
    status: AgentProposalStatus.Pending,
    result: null,
    resultIsError: false,
    decidedByUserId: null,
    decidedAt: null,
    finishedAt: null,
    expiresAt: new Date(now.getTime() + PENDING_FOR_MS),
    createdAt: now,
    updatedAt: now,
    user: { name: 'Dana' },
    decidedBy: null,
    ...overrides,
  };
}

/** Proposals in memory, with the repository's conditional updates, for service tests. */
export class InMemoryAgentProposalRepository {
  readonly records: AgentProposalRecord[] = [];
  readonly keyNames = new Map<string, string>();

  asRepository(): AgentProposalRepository {
    return this as unknown as AgentProposalRepository;
  }

  create(data: NewAgentProposal): Promise<AgentProposalRecord> {
    const record = proposalRecord({ ...(data as Partial<AgentProposalRecord>), id: randomUUID() });
    this.records.push(record);
    return Promise.resolve(record);
  }

  find(workspaceId: string, id: string): Promise<AgentProposalRecord | null> {
    const found = this.records.find(
      (record) => record.id === id && record.workspaceId === workspaceId,
    );
    return Promise.resolve(found ?? null);
  }

  findForProposer(
    proposer: Pick<AgentProposer, 'workspaceId' | 'userId' | 'oauthClientId' | 'apiKeyId'>,
    id: string,
  ): Promise<AgentProposalRecord | null> {
    const found = this.records.find(
      (record) =>
        record.id === id &&
        record.workspaceId === proposer.workspaceId &&
        record.userId === proposer.userId &&
        record.oauthClientId === proposer.oauthClientId &&
        record.apiKeyId === proposer.apiKeyId,
    );
    return Promise.resolve(found ?? null);
  }

  list(
    workspaceId: string,
    query: AgentProposalListQuery,
  ): Promise<{ records: AgentProposalRecord[]; total: number }> {
    const matching = this.records.filter(
      (record) =>
        record.workspaceId === workspaceId && (!query.status || record.status === query.status),
    );
    return Promise.resolve({ records: matching, total: matching.length });
  }

  decide(
    workspaceId: string,
    id: string,
    status: AgentProposalStatus,
    decision: { userId: string; now: Date },
  ): Promise<boolean> {
    const record = this.records.find(
      (candidate) => candidate.id === id && candidate.workspaceId === workspaceId,
    );
    const open = record?.status === AgentProposalStatus.Pending && record.expiresAt > decision.now;
    if (!record || !open) return Promise.resolve(false);
    Object.assign(record, {
      status,
      decidedByUserId: decision.userId,
      decidedAt: decision.now,
      decidedBy: { name: 'Lee' },
    });
    return Promise.resolve(true);
  }

  finish(id: string, outcome: AgentProposalOutcomeRecord): Promise<void> {
    const record = this.records.find((candidate) => candidate.id === id);
    if (record) Object.assign(record, outcome, { finishedAt: new Date() });
    return Promise.resolve();
  }

  countPending(workspaceId: string): Promise<number> {
    const pending = this.records.filter(
      (record) =>
        record.workspaceId === workspaceId && record.status === AgentProposalStatus.Pending,
    );
    return Promise.resolve(pending.length);
  }

  apiKeyName(_workspaceId: string, apiKeyId: string): Promise<string | null> {
    return Promise.resolve(this.keyNames.get(apiKeyId) ?? null);
  }
}
