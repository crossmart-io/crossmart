import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  ASK_QUESTION_MAX_LENGTH,
  ASK_QUESTION_MIN_LENGTH,
  type AskCaller,
  AskChannel,
  AskConversationsService,
  AskEscalationsService,
  AskService,
} from '@crossmart/core';
import type { A2aSendMessageResult } from '../entities/a2a-protocol.js';
import { A2aErrorCode } from '../enums/a2a-error-code.enum.js';
import { A2aErrorReason, A2aRpcError } from '../errors/a2a-rpc.error.js';
import { answeredTask, escalationTask } from '../mappers/a2a-task.mapper.js';
import {
  type EscalateData,
  escalateDataSchema,
  type IncomingMessage,
  type SendMessageParams,
} from '../schemas/a2a-request.schemas.js';

const TEXT_JOINER = '\n';
const FILES_NOT_SUPPORTED = 'Only text parts, and a data part to escalate, are supported';
const NOTHING_TO_ANSWER = 'The message has no text to answer and no escalation';
const QUESTION_LENGTH = `A question is ${ASK_QUESTION_MIN_LENGTH} to ${ASK_QUESTION_MAX_LENGTH} characters`;
const ESCALATION_NEEDS_CONTEXT = 'Escalating needs the contextId of the conversation';
const TASK_IS_COMPLETED =
  'Crossmart’s tasks complete with their answer; send a new message with the same contextId instead';

/** What a message asks for: a question, an escalation, or both (the question first). */
interface MessageIntent {
  question: string;
  escalate: EscalateData | null;
}

/**
 * `SendMessage` (A2A 1.0 §3.1.1): a message's text is a question to Ask Crossmart in the
 * conversation named by `contextId` (a new one without it), answered as a completed task; a
 * data part `{"action": "escalate", …}` hands the conversation to a person instead.
 */
@Injectable()
export class A2aMessageHandler {
  constructor(
    private readonly ask: AskService,
    private readonly conversations: AskConversationsService,
    private readonly escalations: AskEscalationsService,
  ) {}

  async send(params: SendMessageParams, caller: AskCaller): Promise<A2aSendMessageResult> {
    const { message, configuration } = params;
    await this.refuseTaskContinuation(message, caller);
    const intent = this.intentOf(message);
    if (intent.escalate) return this.escalate(message, intent.escalate, caller);
    const reply = await this.ask.ask({
      question: intent.question,
      conversationId: message.contextId,
      channel: AskChannel.A2a,
      caller,
    });
    const task = answeredTask(
      {
        taskId: reply.turnId,
        contextId: reply.conversationId,
        question: intent.question,
        answer: reply.answer,
        outcome: reply.outcome,
        confidence: reply.confidence,
        citations: reply.citations,
        escalationReason: reply.escalation.reason,
        extra: { handoff: reply.handoff, supportEmail: reply.supportEmail },
        at: new Date(),
      },
      { historyLength: configuration?.historyLength, includeArtifacts: true },
    );
    return { task };
  }

  private async escalate(
    message: IncomingMessage,
    data: EscalateData,
    caller: AskCaller,
  ): Promise<A2aSendMessageResult> {
    if (!message.contextId) throw A2aRpcError.invalidParams(ESCALATION_NEEDS_CONTEXT);
    const opened = await this.escalations.open(
      { conversationId: message.contextId, ...data },
      caller,
    );
    const task = escalationTask(opened, message.contextId);
    return {
      task: opened.callbackSecret
        ? { ...task, metadata: { ...task.metadata, callbackSecret: opened.callbackSecret } }
        : task,
    };
  }

  /** Every task is complete once answered, so a message cannot continue one (§3.1.1). */
  private async refuseTaskContinuation(message: IncomingMessage, caller: AskCaller): Promise<void> {
    if (!message.taskId) return;
    const turn = isUUID(message.taskId)
      ? await this.conversations.findTurn(message.taskId, caller)
      : null;
    if (!turn) throw A2aRpcError.taskNotFound(message.taskId);
    throw A2aRpcError.unsupported(TASK_IS_COMPLETED);
  }

  private intentOf(message: IncomingMessage): MessageIntent {
    if (message.parts.some((part) => part.raw !== undefined || part.url !== undefined)) {
      throw new A2aRpcError(
        A2aErrorCode.ContentTypeNotSupported,
        FILES_NOT_SUPPORTED,
        A2aErrorReason.ContentTypeNotSupported,
      );
    }
    const question = message.parts
      .flatMap((part) => (part.text ? [part.text.trim()] : []))
      .join(TEXT_JOINER);
    const escalate = message.parts
      .map((part) => escalateDataSchema.safeParse(part.data))
      .find((parsed) => parsed.success)?.data;
    if (escalate) return { question, escalate };
    if (!question) throw A2aRpcError.invalidParams(NOTHING_TO_ANSWER);
    if (question.length < ASK_QUESTION_MIN_LENGTH || question.length > ASK_QUESTION_MAX_LENGTH) {
      throw A2aRpcError.invalidParams(QUESTION_LENGTH);
    }
    return { question, escalate: null };
  }
}
