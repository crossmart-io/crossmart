import type {
  AgentWorkerActionPreview,
  AgentWorkerActionTargets,
} from '../../agent-worker/entities/agent-worker-views.js';
import type { AgentWorkerActionRisk } from '../../agent-worker/enums/agent-worker-action-risk.enum.js';
import type { AgentApprovalExemption } from '../enums/agent-approval-exemption.enum.js';
import type { AgentProposalOutcome } from '../enums/agent-proposal-outcome.enum.js';
import type { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import type { AgentProposerKind } from '../enums/agent-proposer-kind.enum.js';

/** An outside agent's proposed change, as the seller and the agent read it (ADR 0028). */
export interface AgentProposalView {
  id: string;
  toolName: string;
  /** The tool's title, such as "Change a variant's price". */
  toolTitle: string;
  status: AgentProposalStatus;
  proposerKind: AgentProposerKind;
  /** "Claude"; for an MCP session with a key, the key's name. */
  agentName: string;
  /** The person the agent acts for; null once deleted. */
  onBehalfOfName: string | null;
  summary: string;
  risks: AgentWorkerActionRisk[];
  preview: AgentWorkerActionPreview | null;
  targets: AgentWorkerActionTargets;
  /** The API's answer or refusal once it ran. */
  result: string | null;
  isError: boolean;
  decidedByName: string | null;
  decidedAt: Date | null;
  finishedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface AgentProposalPage {
  items: AgentProposalView[];
  total: number;
}

/** The answer to a call sent to be proposed. */
export interface AgentProposalSubmission {
  outcome: AgentProposalOutcome;
  /** What the agent should do or tell its user. */
  message: string;
  /** The stored proposal; null when the change is to be made directly. */
  proposal: AgentProposalView | null;
  /**
   * Set when the workspace approves agents' changes but this call needs none, such as a new
   * draft; null otherwise.
   */
  exemption: AgentApprovalExemption | null;
}

export interface AgentProposalListQuery {
  status?: AgentProposalStatus;
  page: number;
  limit: number;
}
