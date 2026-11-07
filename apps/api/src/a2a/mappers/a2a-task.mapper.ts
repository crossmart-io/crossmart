import {
  type AskCitation,
  type AskConfidence,
  type AskEscalationReason,
  type AskEscalationTicket,
  AskEscalationStatus,
  type AskOutcome,
} from '@crossmart/core';
import {
  A2A_ANSWER_ARTIFACT_NAME,
  A2A_ESCALATION_OFFER_TEXT,
  A2A_ESCALATION_OPENED_TEXT,
  A2A_ESCALATION_REPLIED_TEXT,
  A2A_JSON_MEDIA_TYPE,
  A2A_REPLY_ARTIFACT_NAME,
} from '../a2a.constants.js';
import type { A2aArtifact, A2aMessage, A2aPart, A2aTask } from '../entities/a2a-protocol.js';
import { A2aRole } from '../enums/a2a-role.enum.js';
import { A2aTaskState } from '../enums/a2a-task-state.enum.js';

/** One question and its answer, from a fresh reply or a stored turn. */
export interface AnsweredTurn {
  taskId: string;
  contextId: string;
  question: string;
  answer: string;
  outcome: AskOutcome;
  confidence: AskConfidence;
  citations: readonly AskCitation[];
  /** Why a person is offered; null when none is. */
  escalationReason: AskEscalationReason | null;
  /** Fields only a fresh reply has, such as `handoff`. */
  extra?: Record<string, unknown>;
  at: Date;
}

/** What to include of a task, from the request's `historyLength` and `includeArtifacts`. */
export interface TaskShape {
  historyLength?: number;
  includeArtifacts: boolean;
}

const QUESTION_SUFFIX = ':question';
const ANSWER_SUFFIX = ':answer';
const STATUS_SUFFIX = ':status';
const NO_HISTORY = 0;

function textPart(text: string): A2aPart {
  return { text };
}

function agentMessage(
  id: string,
  turn: { taskId: string; contextId?: string },
  text: string,
): A2aMessage {
  return {
    messageId: id,
    taskId: turn.taskId,
    contextId: turn.contextId,
    role: A2aRole.Agent,
    parts: [textPart(text)],
  };
}

/** The answer as text, plus its outcome, confidence and citations as data. */
function answerArtifact(turn: AnsweredTurn): A2aArtifact {
  const data = {
    outcome: turn.outcome,
    confidence: turn.confidence,
    citations: turn.citations,
    escalation: { offered: turn.escalationReason !== null, reason: turn.escalationReason },
    ...turn.extra,
  };
  return {
    artifactId: `${turn.taskId}${ANSWER_SUFFIX}`,
    name: A2A_ANSWER_ARTIFACT_NAME,
    parts: [textPart(turn.answer), { data, mediaType: A2A_JSON_MEDIA_TYPE }],
  };
}

function history(turn: AnsweredTurn, limit: number | undefined): A2aMessage[] | undefined {
  if (limit === NO_HISTORY) return undefined;
  const question: A2aMessage = {
    messageId: `${turn.taskId}${QUESTION_SUFFIX}`,
    taskId: turn.taskId,
    contextId: turn.contextId,
    role: A2aRole.User,
    parts: [textPart(turn.question)],
  };
  const messages = [question, agentMessage(`${turn.taskId}${ANSWER_SUFFIX}`, turn, turn.answer)];
  return limit === undefined ? messages : messages.slice(-limit);
}

/**
 * A question and its answer as an A2A task: completed, the answer as an artifact (text and
 * data), and an offer of a person on the status when there is one.
 */
export function answeredTask(turn: AnsweredTurn, shape: TaskShape): A2aTask {
  const offer = turn.escalationReason
    ? agentMessage(`${turn.taskId}${STATUS_SUFFIX}`, turn, A2A_ESCALATION_OFFER_TEXT)
    : undefined;
  const messages = history(turn, shape.historyLength);
  return {
    id: turn.taskId,
    contextId: turn.contextId,
    status: {
      state: A2aTaskState.Completed,
      timestamp: turn.at.toISOString(),
      ...(offer ? { message: offer } : {}),
    },
    ...(shape.includeArtifacts ? { artifacts: [answerArtifact(turn)] } : {}),
    ...(messages ? { history: messages } : {}),
  };
}

/**
 * An escalation as an A2A task, with the ticket id as its id: working until the team replies,
 * then completed with the reply as an artifact. Its context is the conversation, when known.
 */
export function escalationTask(ticket: AskEscalationTicket, contextId?: string): A2aTask {
  const replied = ticket.status === AskEscalationStatus.Replied && ticket.reply !== null;
  const turn = { taskId: ticket.id, contextId };
  const text = replied ? A2A_ESCALATION_REPLIED_TEXT : A2A_ESCALATION_OPENED_TEXT;
  const at = replied && ticket.repliedAt ? ticket.repliedAt : ticket.createdAt;
  return {
    id: ticket.id,
    ...(contextId ? { contextId } : {}),
    status: {
      state: replied ? A2aTaskState.Completed : A2aTaskState.Working,
      message: agentMessage(`${ticket.id}${STATUS_SUFFIX}`, turn, text),
      timestamp: at.toISOString(),
    },
    metadata: { reason: ticket.reason },
    ...(replied && ticket.reply
      ? {
          artifacts: [
            {
              artifactId: `${ticket.id}${ANSWER_SUFFIX}`,
              name: A2A_REPLY_ARTIFACT_NAME,
              parts: [textPart(ticket.reply)],
            },
          ],
        }
      : {}),
  };
}
