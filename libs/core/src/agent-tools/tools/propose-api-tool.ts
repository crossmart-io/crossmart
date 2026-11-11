import { HttpMethod } from '../api/api-call.js';
import type { CrossmartApiClient } from '../api/crossmart-api-client.js';
import { CrossmartApiError } from '../api/crossmart-api.error.js';
import { AGENT_PROPOSALS_PATH, APPROVAL_EXEMPTION_COPY } from '../agent-tools.constants.js';
import type { AgentApprovalExemption } from '../../agent-proposals/enums/agent-approval-exemption.enum.js';
import { AgentProposalOutcome } from '../../agent-proposals/enums/agent-proposal-outcome.enum.js';
import { AgentProposalStatus } from '../../agent-proposals/enums/agent-proposal-status.enum.js';
import {
  type ApiToolResult,
  type ApiToolSpec,
  runApiTool,
  toRefusalResult,
  toText,
} from './api-tool.js';

/** What the API answers when a call is sent to be proposed. */
interface ProposalSubmission {
  outcome: AgentProposalOutcome;
  message: string;
  proposal: {
    id: string;
    status: string;
    summary: string;
    expiresAt: string;
  } | null;
  /** Absent from APIs older than the exemptions. */
  exemption?: AgentApprovalExemption | null;
}

/** What the agent reads of a stored proposal: no error, just that it waits and how to check. */
function proposedResult(submission: ProposalSubmission): ApiToolResult {
  const { proposal } = submission;
  const shown = {
    status: AgentProposalOutcome.Proposed,
    message: submission.message,
    proposalId: proposal?.id ?? null,
    summary: proposal?.summary ?? null,
    expiresAt: proposal?.expiresAt ?? null,
  };
  return { isError: false, text: toText(shown), value: shown, proposed: true };
}

/** The call's answer, with what it means that it applied without the seller's approval. */
function withExemption(result: ApiToolResult, exemption: AgentApprovalExemption): ApiToolResult {
  if (result.isError) return result;
  const { applied: message } = APPROVAL_EXEMPTION_COPY[exemption];
  return { ...result, applied: { status: AgentProposalStatus.Applied, exemption, message } };
}

/**
 * Runs an outside agent's write the way the workspace wants (ADR 0028): the API is asked to
 * propose it first. When the seller must approve, the agent reads that it waits, with an id for
 * `get_proposal`; when the workspace lets agents apply directly, the call is made as before.
 * A call that needs no approval (a new draft) is made at once, and the agent is told why.
 */
export async function proposeApiTool(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
): Promise<ApiToolResult> {
  let submission: ProposalSubmission;
  try {
    const body = { tool: spec.name, input };
    const call = { method: HttpMethod.Post, path: AGENT_PROPOSALS_PATH, body };
    submission = (await client.call(call)) as ProposalSubmission;
  } catch (error) {
    if (!(error instanceof CrossmartApiError)) throw error;
    return toRefusalResult(spec, error);
  }
  if (submission.outcome === AgentProposalOutcome.ApplyDirectly) {
    const result = await runApiTool(spec, client, input);
    return submission.exemption ? withExemption(result, submission.exemption) : result;
  }
  return proposedResult(submission);
}
