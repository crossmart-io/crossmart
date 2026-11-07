import { Injectable, Logger } from '@nestjs/common';
import { describeError } from '@crossmart/common';
import type { AgentWorkerOwner } from '../entities/agent-worker-owner.js';
import type { AgentWorkerPreparedTurn } from '../entities/agent-worker-prepared-turn.js';
import type { AgentWorkerRun } from '../entities/agent-worker-run.js';
import type { AgentWorkerEventSink } from '../entities/agent-worker-stream.js';
import { AgentWorkerErrorCode } from '../enums/agent-worker-error-code.enum.js';
import { AgentWorkerEventType } from '../enums/agent-worker-event-type.enum.js';
import { AgentWorkerTurnStatus } from '../enums/agent-worker-turn-status.enum.js';
import { toMessageView, toTurnView } from '../mappers/agent-worker.mapper.js';
import type { AgentWorkerTurnEnding } from '../repositories/agent-worker-turn.repository.js';
import { describeTurnError } from '../rules/turn-error.js';
import { AgentWorkerCancellation } from './agent-worker-cancellation.js';
import { AgentWorkerDecisions } from './agent-worker-decisions.js';
import { AgentWorkerLoop } from './agent-worker-loop.js';
import { AgentWorkerStore } from './agent-worker-store.js';

/**
 * Runs and stops Agent Worker's turns. A turn's events go to a sink (the HTTP event stream);
 * failures end the turn with a reason the person can read, never with internals, and the
 * conversation is always released for the next turn.
 */
@Injectable()
export class AgentWorkerTurnRunner {
  private readonly logger = new Logger(AgentWorkerTurnRunner.name);

  constructor(
    private readonly store: AgentWorkerStore,
    private readonly loop: AgentWorkerLoop,
    private readonly decisions: AgentWorkerDecisions,
    private readonly cancellation: AgentWorkerCancellation,
  ) {}

  /** Runs a started turn, sending its events to `sink`. */
  async stream(prepared: AgentWorkerPreparedTurn, sink: AgentWorkerEventSink): Promise<void> {
    const { scope, turn, tools } = prepared;
    const signal = this.cancellation.start(turn.id);
    const run: AgentWorkerRun = {
      scope,
      turnId: turn.id,
      tools,
      sink,
      signal,
      untrustedSeen: false,
    };
    sink.emit({ type: AgentWorkerEventType.TurnStarted, turn: toTurnView(turn) });
    if (prepared.userMessage) {
      const message = toMessageView(prepared.userMessage, String);
      sink.emit({ type: AgentWorkerEventType.Message, message });
    }
    try {
      const finished = await this.store.turns.finish(turn.id, await this.execute(run, prepared));
      sink.emit({ type: AgentWorkerEventType.TurnFinished, turn: toTurnView(finished) });
    } finally {
      this.cancellation.end(turn.id);
      await this.store.conversations.releaseTurn(scope.conversationId, turn.id);
    }
  }

  /** Stops the conversation's running turn, wherever it runs; false when none runs. */
  async cancel(owner: AgentWorkerOwner, conversationId: string): Promise<boolean> {
    const conversation = await this.store.requireConversation(owner, conversationId);
    const turnId = conversation.runningTurnId;
    if (!turnId) return false;
    await this.store.turns.requestCancel(turnId);
    this.cancellation.abort(turnId);
    return true;
  }

  /** Stops a turn this instance runs, such as when its stream's client went away. */
  abandon(turnId: string): void {
    this.cancellation.abort(turnId);
  }

  private async execute(
    run: AgentWorkerRun,
    prepared: AgentWorkerPreparedTurn,
  ): Promise<AgentWorkerTurnEnding> {
    try {
      if (prepared.decision && (await this.decisions.apply(run, prepared.decision)) === 0) {
        return { status: AgentWorkerTurnStatus.Completed };
      }
      return await this.loop.run(run);
    } catch (error) {
      return this.failed(run, error);
    }
  }

  private failed(run: AgentWorkerRun, error: unknown): AgentWorkerTurnEnding {
    if (run.signal.aborted) return { status: AgentWorkerTurnStatus.Cancelled };
    const view = describeTurnError(error);
    if (view.code === AgentWorkerErrorCode.Internal) {
      this.logger.error(`Agent Worker turn ${run.turnId} failed: ${describeError(error)}`);
    }
    run.sink.emit({ type: AgentWorkerEventType.Error, error: view });
    return { status: AgentWorkerTurnStatus.Failed, failureReason: view.message };
  }
}
