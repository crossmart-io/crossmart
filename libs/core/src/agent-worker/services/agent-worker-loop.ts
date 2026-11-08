import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type {
  AiContentBlock,
  AiConversationReply,
  AiToolUseBlock,
} from '../../ai/entities/ai-conversation.js';
import { AiContentBlockType } from '../../ai/enums/ai-content-block-type.enum.js';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { AiStopReason } from '../../ai/enums/ai-stop-reason.enum.js';
import { agentWorkerSystemPrompt } from '../../ai/prompts/agent-worker.v1.prompt.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import {
  AGENT_WORKER_ANSWER_REFUSED,
  AGENT_WORKER_ANSWER_TRUNCATED,
  AGENT_WORKER_MAX_OUTPUT_TOKENS,
  AGENT_WORKER_MAX_STEPS_PER_TURN,
  AGENT_WORKER_STEP_LIMIT_REACHED,
} from '../agent-worker.constants.js';
import type { AgentWorkerRun } from '../entities/agent-worker-run.js';
import { AgentWorkerEventType } from '../enums/agent-worker-event-type.enum.js';
import { AgentWorkerRole } from '../enums/agent-worker-role.enum.js';
import { AgentWorkerTurnStatus } from '../enums/agent-worker-turn-status.enum.js';
import { toMessageView } from '../mappers/agent-worker.mapper.js';
import type { AgentWorkerMessageRecord } from '../repositories/agent-worker-message.repository.js';
import type { AgentWorkerTurnEnding } from '../repositories/agent-worker-turn.repository.js';
import { buildTranscript } from '../rules/transcript.js';
import { AgentWorkerStore } from './agent-worker-store.js';
import { AgentWorkerToolCalls } from './agent-worker-tool-calls.js';

/** Answers the model cannot be trusted to have finished; their tool calls never run. */
const UNUSABLE_ANSWERS: Partial<Record<AiStopReason, string>> = {
  [AiStopReason.Refused]: AGENT_WORKER_ANSWER_REFUSED,
  [AiStopReason.Truncated]: AGENT_WORKER_ANSWER_TRUNCATED,
};

const SYSTEM_PROMPT = agentWorkerSystemPrompt();
const NO_TEXT = '';

function isToolUse(block: AiContentBlock): block is AiToolUseBlock {
  return block.type === AiContentBlockType.ToolUse;
}

function textOf(content: AiContentBlock[]): string {
  return content
    .flatMap((block) => (block.type === AiContentBlockType.Text ? [block.text] : []))
    .join(NO_TEXT);
}

/**
 * Agent Worker's tool loop for one turn (ADR 0026): call the model with the conversation and
 * the tools, store its answer, run its reads, turn its writes into proposals, and go again
 * until it answers without tools, proposes changes (then it waits for the person), is stopped,
 * or reaches `AGENT_WORKER_MAX_STEPS_PER_TURN` calls. Each call is metered as one AI credit.
 */
@Injectable()
export class AgentWorkerLoop {
  private readonly model: string;

  constructor(
    private readonly ai: AiGateway,
    private readonly store: AgentWorkerStore,
    private readonly toolCalls: AgentWorkerToolCalls,
    config: AppConfigService,
  ) {
    this.model = config.agentWorkerModel;
  }

  async run(run: AgentWorkerRun): Promise<AgentWorkerTurnEnding> {
    for (let step = 0; step < AGENT_WORKER_MAX_STEPS_PER_TURN; step += 1) {
      if (await this.isCancelled(run)) return { status: AgentWorkerTurnStatus.Cancelled };
      const reply = await this.callModel(run);
      const unusable = UNUSABLE_ANSWERS[reply.stopReason];
      const message = await this.storeReply(run, reply, unusable !== undefined);
      if (unusable) return { status: AgentWorkerTurnStatus.Failed, failureReason: unusable };
      const uses = reply.content.filter(isToolUse);
      if (uses.length === 0) return { status: AgentWorkerTurnStatus.Completed };
      const proposed = await this.toolCalls.handle(run, message.id, uses);
      if (proposed > 0) return { status: AgentWorkerTurnStatus.AwaitingApproval };
    }
    return {
      status: AgentWorkerTurnStatus.Completed,
      failureReason: AGENT_WORKER_STEP_LIMIT_REACHED,
    };
  }

  async isCancelled(run: AgentWorkerRun): Promise<boolean> {
    return run.signal.aborted || (await this.store.turns.isCancelRequested(run.turnId));
  }

  private async callModel(run: AgentWorkerRun): Promise<AiConversationReply> {
    const history = await this.store.messages.listOfConversation(run.scope.conversationId);
    const reply = await this.ai.converse(
      { workspaceId: run.scope.workspaceId, feature: AiFeature.AgentWorker },
      {
        system: SYSTEM_PROMPT,
        messages: buildTranscript(history),
        tools: run.tools.map((tool) => tool.definition),
        maxOutputTokens: AGENT_WORKER_MAX_OUTPUT_TOKENS,
        model: this.model,
        signal: run.signal,
      },
      { onTextDelta: (delta) => run.sink.emit({ type: AgentWorkerEventType.TextDelta, delta }) },
    );
    await this.store.turns.recordModelCall(run.turnId, reply.model, reply.usage);
    return reply;
  }

  /** Stores the answer; an unusable one loses its tool calls, which must never run. */
  private async storeReply(
    run: AgentWorkerRun,
    reply: AiConversationReply,
    unusable: boolean,
  ): Promise<AgentWorkerMessageRecord> {
    const content = unusable ? reply.content.filter((block) => !isToolUse(block)) : reply.content;
    const message = await this.store.messages.append({
      conversationId: run.scope.conversationId,
      turnId: run.turnId,
      role: AgentWorkerRole.Assistant,
      text: textOf(content),
      content,
    });
    run.sink.emit({ type: AgentWorkerEventType.Message, message: toMessageView(message, String) });
    return message;
  }
}
