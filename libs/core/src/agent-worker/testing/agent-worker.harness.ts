import { randomUUID } from 'node:crypto';
import { WorkspaceRole } from '@crossmart/database';
import type { AppConfigService } from '@crossmart/common';
import type { AiContentBlock } from '../../ai/entities/ai-conversation.js';
import { AiContentBlockType } from '../../ai/enums/ai-content-block-type.enum.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { AiUsageService } from '../../ai/services/ai-usage.service.js';
import { FakeAiProvider } from '../../ai/testing/fake-ai.provider.js';
import { noSandboxEntitlements } from '../../entitlements/testing/sandbox-entitlements.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import type { SubscriptionAccessPolicy } from '../../entitlements/services/subscription-access-policy.js';
import type { ResolvedRole } from '../../tenancy/entities/role-assignment.js';
import { builtInPermissions } from '../../tenancy/permissions/role-permissions.js';
import type { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import type { AgentWorkerOwner } from '../entities/agent-worker-owner.js';
import type { AgentWorkerPageContext } from '../entities/agent-worker-requests.js';
import type { AgentWorkerStreamEvent } from '../entities/agent-worker-stream.js';
import type { AgentWorkerEventType } from '../enums/agent-worker-event-type.enum.js';
import { AgentWorkerCancellation } from '../services/agent-worker-cancellation.js';
import { AgentWorkerConversationsService } from '../services/agent-worker-conversations.service.js';
import { AgentWorkerDecisions } from '../services/agent-worker-decisions.js';
import { AgentWorkerLoop } from '../services/agent-worker-loop.js';
import { AgentWorkerPreviewer } from '../services/agent-worker-previewer.js';
import { AgentWorkerToolCalls } from '../services/agent-worker-tool-calls.js';
import { AgentWorkerTurnRunner } from '../services/agent-worker-turn-runner.js';
import { AgentWorkerTurnStarter } from '../services/agent-worker-turn-starter.js';
import { AgentWorkerWriteGate } from '../services/agent-worker-write-gate.js';
import { AgentWorkerToolbox } from '../tools/agent-worker-toolbox.js';
import { InMemoryAgentWorkerTables } from './in-memory-agent-worker.store.js';
import { RecordingToolExecutor } from './recording-tool.executor.js';

export const AGENT_WORKER_TEST_MODEL = 'fake-agent-worker-model';

/** A text block, as the fake model answers. */
export function text(value: string): AiContentBlock {
  return { type: AiContentBlockType.Text, text: value };
}

/** A tool call, as the fake model answers. */
export function toolUse(name: string, input: Record<string, unknown>): AiContentBlock {
  return { type: AiContentBlockType.ToolUse, id: `toolu_${randomUUID()}`, name, input };
}

function roleOf(role: Exclude<WorkspaceRole, typeof WorkspaceRole.CUSTOM>): ResolvedRole {
  return { role, customRole: null, permissions: builtInPermissions(role) };
}

/**
 * Agent Worker wired for unit tests: in-memory tables, a scripted model, a recording tool
 * executor, and plain stand-ins for plans, roles and subscriptions. No database, no AI calls.
 */
export class AgentWorkerHarness {
  readonly tables = new InMemoryAgentWorkerTables();
  readonly ai = new FakeAiProvider();
  readonly executor = new RecordingToolExecutor();
  /** The plan's AI credit check; resolves (credits left) unless a test says otherwise. */
  readonly creditCheck = vi.fn<EntitlementService['assertInWorkspace']>().mockResolvedValue();
  readonly entitlements = {
    ...noSandboxEntitlements(),
    assertInWorkspace: this.creditCheck,
  } as unknown as EntitlementService;
  readonly usage = { record: vi.fn<AiUsageService['record']>().mockResolvedValue() };
  readonly subscription = {
    enforced: false,
    assertWritableInWorkspace: vi
      .fn<SubscriptionAccessPolicy['assertWritableInWorkspace']>()
      .mockResolvedValue(),
  };
  /** Each person's role per workspace; Editor unless set. */
  readonly roles = new Map<string, ResolvedRole | null>();
  readonly owner: AgentWorkerOwner = { workspaceId: randomUUID(), userId: randomUUID() };
  readonly conversations: AgentWorkerConversationsService;
  readonly starter: AgentWorkerTurnStarter;
  readonly runner: AgentWorkerTurnRunner;
  readonly cancellation = new AgentWorkerCancellation();

  constructor() {
    const store = this.tables.store();
    const gateway = new AiGateway(
      this.ai,
      this.usage as unknown as AiUsageService,
      this.entitlements,
    );
    const toolbox = new AgentWorkerToolbox(this.workspaceAccess());
    const toolCalls = new AgentWorkerToolCalls(
      store.actions,
      this.executor,
      new AgentWorkerPreviewer(this.executor),
      new AgentWorkerWriteGate(this.subscription as unknown as SubscriptionAccessPolicy),
    );
    const config = { agentWorkerModel: AGENT_WORKER_TEST_MODEL } as AppConfigService;
    const loop = new AgentWorkerLoop(gateway, store, toolCalls, config);
    const decisions = new AgentWorkerDecisions(store.actions, toolbox, toolCalls);
    this.conversations = new AgentWorkerConversationsService(store, toolbox);
    this.starter = new AgentWorkerTurnStarter(store, toolbox, gateway);
    this.runner = new AgentWorkerTurnRunner(store, loop, decisions, this.cancellation);
  }

  setRole(
    owner: AgentWorkerOwner,
    role: Exclude<WorkspaceRole, typeof WorkspaceRole.CUSTOM> | null,
  ): void {
    this.roles.set(`${owner.workspaceId}:${owner.userId}`, role ? roleOf(role) : null);
  }

  async newConversation(owner = this.owner): Promise<string> {
    return (await this.conversations.create(owner)).id;
  }

  /** Sends a message and runs the turn; returns its events. */
  async send(
    conversationId: string,
    message: string,
    options: { owner?: AgentWorkerOwner; context?: AgentWorkerPageContext } = {},
  ): Promise<AgentWorkerStreamEvent[]> {
    const prepared = await this.starter.startMessage({
      owner: options.owner ?? this.owner,
      conversationId,
      text: message,
      context: options.context,
    });
    return this.run(prepared);
  }

  /** Decides on the waiting changes and runs the turn; returns its events. */
  async decide(
    conversationId: string,
    approvedActionIds: string[],
    confirmHighRisk = false,
  ): Promise<AgentWorkerStreamEvent[]> {
    const prepared = await this.starter.startDecision({
      owner: this.owner,
      conversationId,
      approvedActionIds,
      confirmHighRisk,
    });
    return this.run(prepared);
  }

  private async run(
    prepared: Parameters<AgentWorkerTurnRunner['stream']>[0],
  ): Promise<AgentWorkerStreamEvent[]> {
    const events: AgentWorkerStreamEvent[] = [];
    await this.runner.stream(prepared, { emit: (event) => events.push(event) });
    return events;
  }

  private workspaceAccess(): WorkspaceAccessService {
    const findRole = (workspaceId: string, userId: string): Promise<ResolvedRole | null> => {
      const key = `${workspaceId}:${userId}`;
      return Promise.resolve(
        this.roles.has(key) ? (this.roles.get(key) ?? null) : roleOf(WorkspaceRole.EDITOR),
      );
    };
    return { findRole } as unknown as WorkspaceAccessService;
  }
}

/** The events of one type, in order. */
export function eventsOf(
  events: AgentWorkerStreamEvent[],
  type: AgentWorkerEventType,
): AgentWorkerStreamEvent[] {
  return events.filter((event) => event.type === type);
}
