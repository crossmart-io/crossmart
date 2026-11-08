/**
 * What happens to a change an outside agent makes (ADR 0028): a connected agent over OAuth, or
 * any MCP session. Stored as text on the workspace; Crossmart Agent and API keys over REST are
 * not affected.
 */
export enum OutsideAgentChanges {
  /** The change becomes a proposal the seller approves or rejects. The default. */
  RequireApproval = 'require_approval',
  /** The change is made at once, within the agent's scopes and its user's role. */
  ApplyDirectly = 'apply_directly',
}

/** Every workspace starts here, existing ones included. */
export const DEFAULT_OUTSIDE_AGENT_CHANGES = OutsideAgentChanges.RequireApproval;
