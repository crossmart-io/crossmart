/**
 * A proposal waits this many days for a decision, then expires (ADR 0028). A plain file, so the
 * MCP server can tell agents without loading the rest.
 */
export const AGENT_PROPOSAL_TTL_DAYS = 7;
