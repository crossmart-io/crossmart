/** A client the sweep is about to delete, with the name its history should keep. */
export interface StaleAgentClient {
  clientId: string;
  /** Its name as people saw it, from `agentClientName`. */
  name: string;
}

/** A workspace a client acted in, from the activity log. */
export interface AgentClientWorkspace {
  clientId: string;
  workspaceId: string;
}

/** What one sweep deleted. */
export interface AgentClientSweepResult {
  /** Self-registered clients never used within a day of registering. */
  neverUsed: number;
  /** Clients of any kind that nobody used for `STALE_AGENT_CLIENT_TTL_MS`. */
  stale: number;
}
