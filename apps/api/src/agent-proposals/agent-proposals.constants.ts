export const AGENT_PROPOSALS_TAG = 'Agent proposals';
export const AGENT_PROPOSALS_ROUTE = 'workspaces/:workspaceId/agent-proposals';
/** Named `proposalId` in `AgentProposalParamsDto`. */
export const PROPOSAL_PATH = ':proposalId';
export const APPROVE_PATH = `${PROPOSAL_PATH}/approve`;
export const REJECT_PATH = `${PROPOSAL_PATH}/reject`;
export const SUMMARY_PATH = 'summary';

/** Schema names the generated clients use for the proposals' enums. */
export const AGENT_PROPOSAL_STATUS_SCHEMA_NAME = 'AgentProposalStatus';
export const AGENT_PROPOSER_KIND_SCHEMA_NAME = 'AgentProposerKind';
export const AGENT_PROPOSAL_OUTCOME_SCHEMA_NAME = 'AgentProposalOutcome';
export const OUTSIDE_AGENT_CHANGES_SCHEMA_NAME = 'OutsideAgentChanges';

/** Marks a write route an outside agent may call even while its changes need approval. */
export const AGENT_APPROVAL_EXEMPT_METADATA_KEY = 'crossmart:agent-approval-exempt';

/** The refusal a connected agent gets for a direct write that needs approval (ADR 0028). */
export const AGENT_APPROVAL_REQUIRED_CODE = 'agent_approval_required';
export const AGENT_APPROVAL_REQUIRED_MESSAGE =
  'This workspace approves changes made by AI agents. Propose the change instead: POST ' +
  '/api/v1/workspaces/{workspaceId}/agent-proposals with { "tool": "<MCP tool name>", ' +
  '"input": { … } } (or call the tool over MCP), then check it with GET …/agent-proposals/{id}.';

/** Only signed-in people may decide whether outside agents need approval. */
export const OUTSIDE_AGENT_CHANGES_PEOPLE_ONLY =
  "Only a signed-in person can change whether outside agents' changes need approval.";

/** People read proposals with the suggestions inbox's permission. */
export const PROPOSALS_VIEW_REQUIRED = 'Requires the suggestions:view permission';
