import { randomUUID } from 'node:crypto';
import type {
  AgentWorkerAction,
  AgentWorkerConversation,
  AgentWorkerMessage,
  AgentWorkerTurn,
} from '@crossmart/database';
import type { AiTokenUsage } from '../../ai/entities/ai-completion.js';
import type { AgentWorkerOwner } from '../entities/agent-worker-owner.js';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import { AgentWorkerTurnStatus } from '../enums/agent-worker-turn-status.enum.js';
import type { AgentWorkerTurnTrigger } from '../enums/agent-worker-turn-trigger.enum.js';
import type {
  AgentWorkerActionOutcome,
  AgentWorkerActionRepository,
  NewAgentWorkerAction,
} from '../repositories/agent-worker-action.repository.js';
import type {
  AgentWorkerConversationRecord,
  AgentWorkerConversationRepository,
} from '../repositories/agent-worker-conversation.repository.js';
import type {
  AgentWorkerMessageRecord,
  AgentWorkerMessageRepository,
  NewAgentWorkerMessage,
} from '../repositories/agent-worker-message.repository.js';
import type {
  AgentWorkerTurnEnding,
  AgentWorkerTurnRepository,
} from '../repositories/agent-worker-turn.repository.js';
import { AgentWorkerStore } from '../services/agent-worker-store.js';

/** Rows get increasing timestamps from here, so ordering in tests is deterministic. */
const TEST_EPOCH = new Date('2026-11-01T00:00:00Z').getTime();
const EPOCH = new Date(0);

/** Agent Worker's rows in memory, shared by the in-memory repositories. */
export class InMemoryAgentWorkerTables {
  readonly conversations: AgentWorkerConversation[] = [];
  readonly turns: AgentWorkerTurn[] = [];
  readonly messages: AgentWorkerMessage[] = [];
  readonly actions: AgentWorkerAction[] = [];
  private clock = TEST_EPOCH;

  now(): Date {
    this.clock += 1;
    return new Date(this.clock);
  }

  pendingOf(conversationId: string): AgentWorkerAction[] {
    return this.actions.filter(
      (row) =>
        row.conversationId === conversationId && row.status === AgentWorkerActionStatus.Proposed,
    );
  }

  /** A store whose repositories work on these rows. */
  store(): AgentWorkerStore {
    return new AgentWorkerStore(
      new InMemoryConversations(this) as unknown as AgentWorkerConversationRepository,
      new InMemoryTurns(this) as unknown as AgentWorkerTurnRepository,
      new InMemoryMessages(this) as unknown as AgentWorkerMessageRepository,
      new InMemoryActions(this) as unknown as AgentWorkerActionRepository,
    );
  }
}

class InMemoryConversations {
  constructor(private readonly tables: InMemoryAgentWorkerTables) {}

  create(owner: AgentWorkerOwner, title: string): Promise<AgentWorkerConversationRecord> {
    const at = this.tables.now();
    const row: AgentWorkerConversation = {
      id: randomUUID(),
      ...owner,
      title,
      runningTurnId: null,
      runningTurnStartedAt: null,
      lastActivityAt: at,
      createdAt: at,
      updatedAt: at,
    };
    this.tables.conversations.push(row);
    return Promise.resolve(this.record(row));
  }

  findOfOwner(owner: AgentWorkerOwner, id: string): Promise<AgentWorkerConversationRecord | null> {
    const row = this.ownedBy(owner, id);
    return Promise.resolve(row ? this.record(row) : null);
  }

  listOfOwner(
    owner: AgentWorkerOwner,
  ): Promise<{ items: AgentWorkerConversationRecord[]; total: number }> {
    const rows = this.tables.conversations.filter(
      (row) => row.workspaceId === owner.workspaceId && row.userId === owner.userId,
    );
    return Promise.resolve({ items: rows.map((row) => this.record(row)), total: rows.length });
  }

  deleteOfOwner(owner: AgentWorkerOwner, id: string): Promise<boolean> {
    const row = this.ownedBy(owner, id);
    if (row) this.tables.conversations.splice(this.tables.conversations.indexOf(row), 1);
    return Promise.resolve(row !== undefined);
  }

  claimTurn(id: string, turnId: string, staleBefore: Date): Promise<boolean> {
    const row = this.find(id);
    const free = !row.runningTurnId || (row.runningTurnStartedAt ?? EPOCH) < staleBefore;
    if (free)
      Object.assign(row, { runningTurnId: turnId, runningTurnStartedAt: this.tables.now() });
    return Promise.resolve(free);
  }

  releaseTurn(id: string, turnId: string): Promise<void> {
    const row = this.find(id);
    if (row.runningTurnId === turnId)
      Object.assign(row, { runningTurnId: null, runningTurnStartedAt: null });
    return Promise.resolve();
  }

  touch(id: string, title?: string): Promise<void> {
    Object.assign(this.find(id), {
      lastActivityAt: this.tables.now(),
      ...(title ? { title } : {}),
    });
    return Promise.resolve();
  }

  private find(id: string): AgentWorkerConversation {
    const row = this.tables.conversations.find((candidate) => candidate.id === id);
    if (!row) throw new Error(`No conversation ${id}`);
    return row;
  }

  private ownedBy(owner: AgentWorkerOwner, id: string): AgentWorkerConversation | undefined {
    return this.tables.conversations.find(
      (row) =>
        row.id === id && row.workspaceId === owner.workspaceId && row.userId === owner.userId,
    );
  }

  private record(row: AgentWorkerConversation): AgentWorkerConversationRecord {
    return { ...row, pendingActionCount: this.tables.pendingOf(row.id).length };
  }
}

class InMemoryTurns {
  constructor(private readonly tables: InMemoryAgentWorkerTables) {}

  create(conversationId: string, trigger: AgentWorkerTurnTrigger): Promise<AgentWorkerTurn> {
    const turn: AgentWorkerTurn = {
      id: randomUUID(),
      conversationId,
      trigger,
      status: AgentWorkerTurnStatus.Running,
      model: null,
      modelCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      failureReason: null,
      cancelRequestedAt: null,
      startedAt: this.tables.now(),
      finishedAt: null,
    };
    this.tables.turns.push(turn);
    return Promise.resolve(turn);
  }

  delete(id: string): Promise<AgentWorkerTurn> {
    const turn = this.find(id);
    this.tables.turns.splice(this.tables.turns.indexOf(turn), 1);
    return Promise.resolve(turn);
  }

  recordModelCall(id: string, model: string, usage: AiTokenUsage): Promise<void> {
    const turn = this.find(id);
    turn.model = model;
    turn.modelCalls += 1;
    turn.inputTokens += usage.inputTokens;
    turn.outputTokens += usage.outputTokens;
    return Promise.resolve();
  }

  finish(id: string, ending: AgentWorkerTurnEnding): Promise<AgentWorkerTurn> {
    const turn = this.find(id);
    Object.assign(turn, { status: ending.status, failureReason: ending.failureReason ?? null });
    return Promise.resolve({ ...turn });
  }

  closeAwaitingApproval(conversationId: string): Promise<void> {
    for (const turn of this.tables.turns) {
      const waiting = turn.status === AgentWorkerTurnStatus.AwaitingApproval;
      if (turn.conversationId === conversationId && waiting)
        turn.status = AgentWorkerTurnStatus.Completed;
    }
    return Promise.resolve();
  }

  requestCancel(id: string): Promise<void> {
    this.find(id).cancelRequestedAt = this.tables.now();
    return Promise.resolve();
  }

  isCancelRequested(id: string): Promise<boolean> {
    return Promise.resolve(this.find(id).cancelRequestedAt !== null);
  }

  findActive(conversationId: string): Promise<AgentWorkerTurn | null> {
    const active = [
      AgentWorkerTurnStatus.Running,
      AgentWorkerTurnStatus.AwaitingApproval,
    ] as string[];
    const turn = this.tables.turns.findLast(
      (row) => row.conversationId === conversationId && active.includes(row.status),
    );
    return Promise.resolve(turn ?? null);
  }

  private find(id: string): AgentWorkerTurn {
    const turn = this.tables.turns.find((row) => row.id === id);
    if (!turn) throw new Error(`No turn ${id}`);
    return turn;
  }
}

class InMemoryMessages {
  constructor(private readonly tables: InMemoryAgentWorkerTables) {}

  append(message: NewAgentWorkerMessage): Promise<AgentWorkerMessageRecord> {
    const earlier = this.tables.messages.filter(
      (row) => row.conversationId === message.conversationId,
    );
    const row: AgentWorkerMessage = {
      id: randomUUID(),
      ...message,
      content: structuredClone(message.content) as unknown as AgentWorkerMessage['content'],
      position: earlier.length + 1,
      createdAt: this.tables.now(),
    };
    this.tables.messages.push(row);
    return Promise.resolve(this.withActions(row));
  }

  listOfConversation(conversationId: string): Promise<AgentWorkerMessageRecord[]> {
    const rows = this.tables.messages.filter((row) => row.conversationId === conversationId);
    return Promise.resolve(rows.map((row) => this.withActions(row)));
  }

  private withActions(message: AgentWorkerMessage): AgentWorkerMessageRecord {
    const actions = this.tables.actions.filter((action) => action.messageId === message.id);
    return { ...message, actions: actions.map((action) => ({ ...action })) };
  }
}

class InMemoryActions {
  constructor(private readonly tables: InMemoryAgentWorkerTables) {}

  create(action: NewAgentWorkerAction): Promise<AgentWorkerAction> {
    const row: AgentWorkerAction = {
      ...action,
      id: randomUUID(),
      input: action.input as AgentWorkerAction['input'],
      risks: action.risks ?? [],
      preview: (action.preview ?? null) as AgentWorkerAction['preview'],
      result: action.result ?? null,
      resultIsError: action.resultIsError ?? false,
      untrustedWarning: action.untrustedWarning ?? false,
      decidedByUserId: null,
      decidedAt: null,
      executedAt: null,
      finishedAt: null,
      createdAt: this.tables.now(),
    };
    this.tables.actions.push(row);
    return Promise.resolve({ ...row });
  }

  finish(id: string, outcome: AgentWorkerActionOutcome): Promise<AgentWorkerAction> {
    const row = this.find(id);
    Object.assign(row, outcome);
    row.finishedAt = this.tables.now();
    if (outcome.status === AgentWorkerActionStatus.Executed) row.executedAt = row.finishedAt;
    return Promise.resolve({ ...row });
  }

  listPending(conversationId: string): Promise<AgentWorkerAction[]> {
    return Promise.resolve(this.tables.pendingOf(conversationId).map((row) => ({ ...row })));
  }

  decide(
    ids: string[],
    status: AgentWorkerActionStatus,
    decidedByUserId: string | null,
  ): Promise<number> {
    const pending = this.tables.actions.filter(
      (row) => ids.includes(row.id) && row.status === AgentWorkerActionStatus.Proposed,
    );
    for (const row of pending)
      Object.assign(row, { status, decidedByUserId, decidedAt: this.tables.now() });
    return Promise.resolve(pending.length);
  }

  expirePending(conversationId: string): Promise<number> {
    const pending = this.tables.pendingOf(conversationId);
    for (const row of pending) row.status = AgentWorkerActionStatus.Expired;
    return Promise.resolve(pending.length);
  }

  findById(id: string): Promise<AgentWorkerAction | null> {
    const row = this.tables.actions.find((candidate) => candidate.id === id);
    return Promise.resolve(row ? { ...row } : null);
  }

  private find(id: string): AgentWorkerAction {
    const row = this.tables.actions.find((candidate) => candidate.id === id);
    if (!row) throw new Error(`No action ${id}`);
    return row;
  }
}
