export const AGENTS_TAG = 'Agents';
/** The agents connected to a workspace with OAuth (ADR 0019). */
export const AGENT_CONNECTIONS_ROUTE = 'workspaces/:workspaceId/agent-connections';
export const AGENT_CONNECTION_ID_PARAM = 'connectionId';
/** Steps of an agent's OAuth authorization that the web app drives for the signed-in user. */
export const AGENT_AUTHORIZATION_ROUTE = 'oauth';
export const AGENT_WORKSPACE_ROUTE = 'workspace';
/** The agent asking for access, as the consent page shows it. */
export const AGENT_CLIENT_ROUTE = 'client';
/** Longer than any client id: metadata document URLs, or Better Auth's generated ids. */
export const AGENT_CLIENT_ID_MAX_LENGTH = 2048;
/** The name the generated web client uses for the scope enum. */
export const AGENT_SCOPE_SCHEMA_NAME = 'AgentScope';
export const AGENT_CLIENT_REGISTRATION_SCHEMA_NAME = 'AgentClientRegistration';
