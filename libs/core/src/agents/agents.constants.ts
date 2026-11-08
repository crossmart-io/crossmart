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

/** RFC 9728: where a protected resource publishes its metadata, before the resource's own path. */
export const PROTECTED_RESOURCE_METADATA_PATH = '/.well-known/oauth-protected-resource';
/** The RFC 6750 scheme of the `WWW-Authenticate` challenge a 401 carries. */
export const BEARER_CHALLENGE_SCHEME = 'Bearer';
/** RFC 6750's error code for a credential that was sent but refused. */
export const INVALID_TOKEN_ERROR = 'invalid_token';
/** Separates the parameters of a `WWW-Authenticate` challenge. */
export const CHALLENGE_PARAMETER_SEPARATOR = ', ';

/**
 * auth.md (WorkOS, v0.6.0): the Markdown that tells AI agents how to sign up and authenticate,
 * served by crossmart.io and named as `agent_auth.skill` in the authorization server metadata.
 */
export const AGENT_AUTH_SKILL_URL = 'https://crossmart.io/auth.md';

/** How Better Auth's `cimd()` marks the clients it created from a Client ID Metadata Document. */
export const CIMD_CLIENT_DISCOVERY_ID = 'cimd';

/** Dynamically registered clients that never complete a grant are deleted after this long. */
export const UNUSED_AGENT_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;
/**
 * Clients nobody has used for this long are deleted, whether they registered themselves or came
 * from a metadata document, unless a user still has them connected or holds a live refresh token.
 */
export const STALE_AGENT_CLIENT_TTL_MS = 90 * 24 * 60 * 60 * 1000;
/** Stale clients deleted per query, so one sweep never holds a long transaction. */
export const AGENT_CLIENT_SWEEP_BATCH_SIZE = 200;
/** Batches one sweep runs at most; the next hourly sweep picks up the rest. */
export const AGENT_CLIENT_SWEEP_MAX_BATCHES = 50;
/** Separates the agent names in the activity event that records their removal. */
export const REMOVED_AGENT_NAME_SEPARATOR = ', ';
/** How often the worker looks for them; one schedule however many workers run. */
export const AGENT_CLIENT_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
export const AGENT_CLIENT_SWEEP_JOB_NAME = 'agent-client-sweep';
export const AGENT_CLIENT_SWEEP_SCHEDULER_ID = 'agent-client-sweep';
