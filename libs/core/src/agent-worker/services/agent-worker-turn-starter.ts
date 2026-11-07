import { Injectable } from '@nestjs/common';
import type { AgentWorkerAction, AgentWorkerTurn } from '@crossmart/database';
import { AiContentBlockType } from '../../ai/enums/ai-content-block-type.enum.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import {
  AGENT_WORKER_DEFAULT_TITLE,
  AGENT_WORKER_TURN_STALE_MS,
} from '../agent-worker.constants.js';
import type { AgentWorkerPreparedTurn } from '../entities/agent-worker-prepared-turn.js';
import type {
  AgentWorkerDecisionRequest,
  AgentWorkerMessageRequest,
} from '../entities/agent-worker-requests.js';
import { AgentWorkerRole } from '../enums/agent-worker-role.enum.js';
import { AgentWorkerTurnStatus } from '../enums/agent-worker-turn-status.enum.js';
import { AgentWorkerTurnTrigger } from '../enums/agent-worker-turn-trigger.enum.js';
import {
  AgentWorkerConfirmationRequiredError,
  AgentWorkerNoPendingActionsError,
  AgentWorkerTurnInProgressError,
  AgentWorkerUnknownActionsError,
} from '../errors/agent-worker.errors.js';
import type { AgentWorkerMessageRecord } from '../repositories/agent-worker-message.repository.js';
import { conversationTitle } from '../rules/conversation-title.js';
import { describePageContext } from '../rules/page-context.js';
import { AgentWorkerToolbox } from '../tools/agent-worker-toolbox.js';
import type { AgentWorkerDecision } from './agent-worker-decisions.js';
import { AgentWorkerStore } from './agent-worker-store.js';

/**
 * Starts Agent Worker's turns. Everything that can be refused with a plain HTTP error is checked
 * here (the conversation, one turn at a time, AI configured, credits left, the decision's
 * actions and confirmation), so a stream only opens once its turn can run.
 */
@Injectable()
export class AgentWorkerTurnStarter {
  constructor(
    private readonly store: AgentWorkerStore,
    private readonly toolbox: AgentWorkerToolbox,
    private readonly ai: AiGateway,
  ) {}

  /** A new message: changes still waiting are dropped, as the person moved on. */
  async startMessage(request: AgentWorkerMessageRequest): Promise<AgentWorkerPreparedTurn> {
    const conversation = await this.store.requireConversation(
      request.owner,
      request.conversationId,
    );
    this.ai.assertConfigured();
    await this.ai.assertCredits(request.owner.workspaceId);
    const tools = await this.toolbox.toolsForMember(request.owner);
    const turn = await this.begin(conversation.id, AgentWorkerTurnTrigger.Message);
    return this.releasingOnFailure(conversation.id, turn, async () => {
      await this.store.actions.expirePending(conversation.id);
      await this.store.turns.closeAwaitingApproval(conversation.id);
      const userMessage = await this.appendUserMessage(request, turn.id);
      const isFirst = conversation.title === AGENT_WORKER_DEFAULT_TITLE;
      const title = isFirst ? conversationTitle(request.text) : undefined;
      await this.store.conversations.touch(conversation.id, title);
      return {
        scope: { ...request.owner, conversationId: conversation.id },
        turn,
        tools,
        userMessage,
      };
    });
  }

  /** A decision on the changes waiting: some approved, the others rejected. */
  async startDecision(request: AgentWorkerDecisionRequest): Promise<AgentWorkerPreparedTurn> {
    const conversation = await this.store.requireConversation(
      request.owner,
      request.conversationId,
    );
    const decision = this.split(await this.store.actions.listPending(conversation.id), request);
    const tools = await this.toolbox.toolsForMember(request.owner);
    const turn = await this.begin(conversation.id, AgentWorkerTurnTrigger.Decision);
    return this.releasingOnFailure(conversation.id, turn, async () => {
      await this.store.turns.closeAwaitingApproval(conversation.id);
      await this.store.conversations.touch(conversation.id);
      return {
        scope: { ...request.owner, conversationId: conversation.id },
        turn,
        tools,
        decision,
      };
    });
  }

  /** Stores the turn and claims the conversation for it, or refuses while another runs. */
  private async begin(
    conversationId: string,
    trigger: AgentWorkerTurnTrigger,
  ): Promise<AgentWorkerTurn> {
    const turn = await this.store.turns.create(conversationId, trigger);
    const staleBefore = new Date(Date.now() - AGENT_WORKER_TURN_STALE_MS);
    if (await this.store.conversations.claimTurn(conversationId, turn.id, staleBefore)) return turn;
    await this.store.turns.delete(turn.id);
    throw new AgentWorkerTurnInProgressError();
  }

  /** Prepares a claimed turn; if that fails, the turn is marked failed and the claim released. */
  private async releasingOnFailure(
    conversationId: string,
    turn: AgentWorkerTurn,
    prepare: () => Promise<AgentWorkerPreparedTurn>,
  ): Promise<AgentWorkerPreparedTurn> {
    try {
      return await prepare();
    } catch (error) {
      await this.store.turns.finish(turn.id, { status: AgentWorkerTurnStatus.Failed });
      await this.store.conversations.releaseTurn(conversationId, turn.id);
      throw error;
    }
  }

  /** The person's text, after a note on where they are in the app when they said. */
  private appendUserMessage(
    request: AgentWorkerMessageRequest,
    turnId: string,
  ): Promise<AgentWorkerMessageRecord> {
    const context = describePageContext(request.context);
    const texts = context ? [context, request.text] : [request.text];
    return this.store.messages.append({
      conversationId: request.conversationId,
      turnId,
      role: AgentWorkerRole.User,
      text: request.text,
      content: texts.map((text) => ({ type: AiContentBlockType.Text, text })),
    });
  }

  /** Checks the decision against what waits: every id must be pending, risky ones confirmed. */
  private split(
    pending: AgentWorkerAction[],
    request: AgentWorkerDecisionRequest,
  ): AgentWorkerDecision {
    if (pending.length === 0) throw new AgentWorkerNoPendingActionsError();
    const approvedIds = new Set(request.approvedActionIds);
    if ([...approvedIds].some((id) => !pending.some((action) => action.id === id))) {
      throw new AgentWorkerUnknownActionsError();
    }
    const approved = pending.filter((action) => approvedIds.has(action.id));
    if (!request.confirmHighRisk && approved.some((action) => action.risks.length > 0)) {
      throw new AgentWorkerConfirmationRequiredError();
    }
    return { approved, rejected: pending.filter((action) => !approvedIds.has(action.id)) };
  }
}
