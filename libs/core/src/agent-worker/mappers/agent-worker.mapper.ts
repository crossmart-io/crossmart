import type { AgentWorkerAction, AgentWorkerTurn } from '@crossmart/database';
import { findEnumValue } from '@crossmart/common';
import { z } from 'zod';
import type {
  AgentWorkerActionPreview,
  AgentWorkerActionView,
  AgentWorkerConversationView,
  AgentWorkerMessageView,
  AgentWorkerTurnView,
} from '../entities/agent-worker-views.js';
import { AgentWorkerActionRisk } from '../enums/agent-worker-action-risk.enum.js';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import { AgentWorkerRole } from '../enums/agent-worker-role.enum.js';
import { AgentWorkerToolKind } from '../enums/agent-worker-tool-kind.enum.js';
import { AgentWorkerTurnStatus } from '../enums/agent-worker-turn-status.enum.js';
import { AgentWorkerTurnTrigger } from '../enums/agent-worker-turn-trigger.enum.js';
import type { AgentWorkerConversationRecord } from '../repositories/agent-worker-conversation.repository.js';
import type { AgentWorkerMessageRecord } from '../repositories/agent-worker-message.repository.js';
import { describeOutcome } from '../rules/action-outcome.js';
import { actionTargets } from '../rules/action-targets.js';

const STORED_PREVIEW = z.object({
  target: z.string().nullable(),
  headline: z.string(),
  details: z.array(z.string()),
  changes: z.array(
    z.object({ label: z.string(), before: z.string().nullable(), after: z.string().nullable() }),
  ),
});

/** Resolves a tool's title from its name, for calls stored before a tool was renamed too. */
export type ToolTitleLookup = (toolName: string) => string;

const FIRST_LINE = /\r?\n/;

function firstLine(text: string | null): string | null {
  return text ? (text.split(FIRST_LINE)[0] ?? null) : null;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function outcomeOf(status: AgentWorkerActionStatus, result: string | null): string | null {
  switch (status) {
    case AgentWorkerActionStatus.Succeeded: {
      const value = result ? parseJson(result) : undefined;
      return value === undefined ? null : describeOutcome(value, false, '');
    }
    case AgentWorkerActionStatus.Executed:
      return describeOutcome(null, false, '');
    case AgentWorkerActionStatus.Failed:
    case AgentWorkerActionStatus.Refused:
    case AgentWorkerActionStatus.ExecutionFailed:
      return firstLine(result);
    default:
      return null;
  }
}

export function previewOf(json: unknown): AgentWorkerActionPreview | null {
  const parsed = STORED_PREVIEW.safeParse(json);
  return parsed.success ? parsed.data : null;
}

export function risksOf(stored: string[]): AgentWorkerActionRisk[] {
  return stored.flatMap((risk) => {
    const known = findEnumValue(AgentWorkerActionRisk, risk);
    return known ? [known] : [];
  });
}

export function toActionView(
  action: AgentWorkerAction,
  titleOf: ToolTitleLookup,
): AgentWorkerActionView {
  const status =
    findEnumValue(AgentWorkerActionStatus, action.status) ?? AgentWorkerActionStatus.Failed;
  return {
    id: action.id,
    messageId: action.messageId,
    toolName: action.toolName,
    toolTitle: titleOf(action.toolName),
    kind: findEnumValue(AgentWorkerToolKind, action.kind) ?? AgentWorkerToolKind.Write,
    status,
    summary: action.summary,
    risks: risksOf(action.risks),
    preview: previewOf(action.preview),
    targets: actionTargets(action.input),
    outcome: outcomeOf(status, action.result),
    isError: action.resultIsError,
    untrustedWarning: action.untrustedWarning,
    decidedAt: action.decidedAt,
    executedAt: action.executedAt,
    createdAt: action.createdAt,
  };
}

export function toMessageView(
  message: AgentWorkerMessageRecord,
  titleOf: ToolTitleLookup,
): AgentWorkerMessageView {
  return {
    id: message.id,
    turnId: message.turnId,
    role: findEnumValue(AgentWorkerRole, message.role) ?? AgentWorkerRole.Assistant,
    text: message.text,
    actions: message.actions.map((action) => toActionView(action, titleOf)),
    createdAt: message.createdAt,
  };
}

export function toTurnView(turn: AgentWorkerTurn): AgentWorkerTurnView {
  return {
    id: turn.id,
    trigger: findEnumValue(AgentWorkerTurnTrigger, turn.trigger) ?? AgentWorkerTurnTrigger.Message,
    status: findEnumValue(AgentWorkerTurnStatus, turn.status) ?? AgentWorkerTurnStatus.Failed,
    modelCalls: turn.modelCalls,
    inputTokens: turn.inputTokens,
    outputTokens: turn.outputTokens,
    failureReason: turn.failureReason,
    startedAt: turn.startedAt,
    finishedAt: turn.finishedAt,
  };
}

export function toConversationView(
  record: AgentWorkerConversationRecord,
): AgentWorkerConversationView {
  return {
    id: record.id,
    title: record.title,
    pendingActionCount: record.pendingActionCount,
    lastActivityAt: record.lastActivityAt,
    createdAt: record.createdAt,
  };
}
