import { findEnumValue } from '@crossmart/common';
import { previewOf, risksOf } from '../../agent-worker/mappers/agent-worker.mapper.js';
import { actionTargets } from '../../agent-worker/rules/action-targets.js';
import type { AgentProposalView } from '../entities/agent-proposal-views.js';
import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import { AgentProposerKind } from '../enums/agent-proposer-kind.enum.js';
import type { AgentProposalRecord } from '../repositories/agent-proposal.queries.js';

/** Resolves a tool's title from its name; the name itself for a tool no longer offered. */
export type ProposalToolTitle = (toolName: string) => string;

/** The status as people read it: pending past its expiry is already expired. */
export function effectiveStatus(record: AgentProposalRecord, now: Date): AgentProposalStatus {
  const status = findEnumValue(AgentProposalStatus, record.status) ?? AgentProposalStatus.Failed;
  const lapsed = status === AgentProposalStatus.Pending && record.expiresAt <= now;
  return lapsed ? AgentProposalStatus.Expired : status;
}

export function toProposalView(
  record: AgentProposalRecord,
  titleOf: ProposalToolTitle,
  now: Date,
): AgentProposalView {
  return {
    id: record.id,
    toolName: record.toolName,
    toolTitle: titleOf(record.toolName),
    status: effectiveStatus(record, now),
    proposerKind:
      findEnumValue(AgentProposerKind, record.proposerKind) ?? AgentProposerKind.OAuthAgent,
    agentName: record.agentName,
    onBehalfOfName: record.user.name,
    summary: record.summary,
    risks: risksOf(record.risks),
    preview: previewOf(record.preview),
    targets: actionTargets(record.input),
    result: record.result,
    isError: record.resultIsError,
    decidedByName: record.decidedBy?.name ?? null,
    decidedAt: record.decidedAt,
    finishedAt: record.finishedAt,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  };
}
