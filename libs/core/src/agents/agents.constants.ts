import { AgentScope } from './enums/agent-scope.enum.js';

/**
 * The access-token claim naming the workspace an agent was given. Namespaced with a URI, as
 * claims of our own should be, so it never collides with a registered claim.
 */
export const AGENT_WORKSPACE_CLAIM = 'https://crossmart.io/workspace_id';

/** The OAuth scope for refresh tokens. */
export const OFFLINE_ACCESS_SCOPE = 'offline_access';

/** Standard OpenID scopes that MCP clients may ask for; they grant nothing in a workspace. */
export const OPENID_SCOPES: readonly string[] = ['openid', 'profile', 'email'];

/** Every Crossmart scope, in the order the consent page lists them. */
export const AGENT_SCOPES: readonly AgentScope[] = Object.values(AgentScope);

/** Scopes a read-only connection keeps. */
export const AGENT_READ_SCOPES: readonly AgentScope[] = [
  AgentScope.CatalogRead,
  AgentScope.OrdersRead,
  AgentScope.ReportsRead,
];

/** Separates scopes in an OAuth `scope` value. */
export const SCOPE_SEPARATOR = ' ';

/** Dynamically registered clients that never complete a grant are deleted after this long. */
export const UNUSED_AGENT_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;
/** How often the worker looks for them; one schedule however many workers run. */
export const AGENT_CLIENT_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
export const AGENT_CLIENT_SWEEP_JOB_NAME = 'agent-client-sweep';
export const AGENT_CLIENT_SWEEP_SCHEDULER_ID = 'agent-client-sweep';
