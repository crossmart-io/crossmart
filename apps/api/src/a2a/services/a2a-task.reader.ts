import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { findEnumValue, requireEnumValue } from '@crossmart/common';
import {
  ASK_ESCALATION_ID_PREFIX,
  type AskCaller,
  AskConfidence,
  AskConversationsService,
  AskEscalationReason,
  AskEscalationsService,
  AskOutcome,
  type AskTurnWithConversation,
  storedCitations,
} from '@crossmart/core';
import { A2A_DEFAULT_PAGE_SIZE, A2A_LAST_PAGE_TOKEN } from '../a2a.constants.js';
import type { A2aListTasksResult, A2aTask } from '../entities/a2a-protocol.js';
import { A2aTaskState } from '../enums/a2a-task-state.enum.js';
import { A2aErrorCode } from '../enums/a2a-error-code.enum.js';
import { A2aErrorReason, A2aRpcError } from '../errors/a2a-rpc.error.js';
import { answeredTask, escalationTask, type TaskShape } from '../mappers/a2a-task.mapper.js';
import type { GetTaskParams, ListTasksParams } from '../schemas/a2a-request.schemas.js';

const ONE_MORE = 1;
const NOT_CANCELABLE =
  'Crossmart’s tasks complete as soon as they are answered, so none can be canceled';

function toTask(turn: AskTurnWithConversation, shape: TaskShape): A2aTask {
  return answeredTask(
    {
      taskId: turn.id,
      contextId: turn.conversation.publicId,
      question: turn.question,
      answer: turn.answer,
      outcome: requireEnumValue(AskOutcome, turn.outcome),
      confidence: requireEnumValue(AskConfidence, turn.confidence),
      citations: storedCitations(turn.citations),
      escalationReason: findEnumValue(AskEscalationReason, turn.escalationReason) ?? null,
      at: turn.createdAt,
    },
    shape,
  );
}

/**
 * `GetTask`, `ListTasks` and `CancelTask` (A2A 1.0 §3.1.3-5). A task is one of the caller's
 * questions (only the caller who asked can read it), or an escalation, whose id is its ticket.
 */
@Injectable()
export class A2aTaskReader {
  constructor(
    private readonly conversations: AskConversationsService,
    private readonly escalations: AskEscalationsService,
  ) {}

  async get(params: GetTaskParams, caller: AskCaller): Promise<A2aTask> {
    if (params.id.startsWith(ASK_ESCALATION_ID_PREFIX)) {
      return escalationTask(await this.escalations.ticket(params.id));
    }
    const turn = isUUID(params.id) ? await this.conversations.findTurn(params.id, caller) : null;
    if (!turn) throw A2aRpcError.taskNotFound(params.id);
    return toTask(turn, { historyLength: params.historyLength, includeArtifacts: true });
  }

  /** The caller's tasks, newest first; all are completed, so other states list nothing. */
  async list(params: ListTasksParams, caller: AskCaller): Promise<A2aListTasksResult> {
    const pageSize = params.pageSize ?? A2A_DEFAULT_PAGE_SIZE;
    if (params.status && params.status !== A2aTaskState.Completed) {
      return { tasks: [], nextPageToken: A2A_LAST_PAGE_TOKEN, pageSize, totalSize: 0 };
    }
    if (params.pageToken && !isUUID(params.pageToken)) {
      throw A2aRpcError.invalidParams('pageToken is not one this server issued');
    }
    const [turns, totalSize] = await Promise.all([
      this.conversations.listTurns(caller, {
        conversationId: params.contextId,
        cursor: params.pageToken,
        take: pageSize + ONE_MORE,
      }),
      this.conversations.countTurns(caller, params.contextId),
    ]);
    const page = turns.slice(0, pageSize);
    const shape = {
      historyLength: params.historyLength,
      includeArtifacts: params.includeArtifacts ?? false,
    };
    return {
      tasks: page.map((turn) => toTask(turn, shape)),
      nextPageToken:
        turns.length > pageSize ? (page.at(-1)?.id ?? A2A_LAST_PAGE_TOKEN) : A2A_LAST_PAGE_TOKEN,
      pageSize,
      totalSize,
    };
  }

  /** Finds the task first, so an unknown id is `TaskNotFound`; a known one is never cancelable. */
  async cancel(params: GetTaskParams, caller: AskCaller): Promise<never> {
    await this.get(params, caller);
    throw new A2aRpcError(
      A2aErrorCode.TaskNotCancelable,
      NOT_CANCELABLE,
      A2aErrorReason.TaskNotCancelable,
      {
        taskId: params.id,
      },
    );
  }
}
