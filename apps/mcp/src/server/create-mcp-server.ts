import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { crossmartVersion } from '@crossmart/common/package/package-version.js';
import type { ApiCredential } from '@crossmart/core/agent-tools/api/api-credential.js';
import { CrossmartApiClient } from '@crossmart/core/agent-tools/api/crossmart-api-client.js';
import { AGENT_PROPOSAL_TTL_DAYS } from '@crossmart/core/agent-proposals/agent-proposal-ttl.js';
import { MCP_SERVER_NAME } from '../mcp.constants.js';
import type { ApiToolSpec } from '@crossmart/core/agent-tools/tools/api-tool.js';
import { registerApiTool } from '../tools/register-api-tool.js';
import type { ToolCallObserver } from '../observability/mcp-request-log.js';
import { ALL_TOOLS, ANONYMOUS_TOOLS } from '@crossmart/core/agent-tools/tools/index.js';

/** Read once from `package.json`, since `npm_package_version` is unset under plain `node`. */
export const SERVER_VERSION = crossmartVersion();

const INSTRUCTIONS =
  'Crossmart keeps one catalog and one stock count for a seller and publishes them to their ' +
  'stores. Start with get_started: it says what the account still needs and who does it. A new ' +
  'account is empty. You can add products with create_product at once, before any store is ' +
  'connected; only the seller can connect a store (in the Crossmart app, from the links ' +
  'get_started gives), and publishing needs one. ' +
  'Read before you write: find ids with list_products, list_inventory or list_stores. ' +
  'Changes wait for the seller: unless the workspace lets agents apply changes directly, a ' +
  'write tool changes nothing yet. It answers status "proposed" with a proposalId, and the ' +
  'seller approves or rejects it in the Crossmart app (Agent proposals). Tell the user it is ' +
  'waiting for their approval, do not send the same change again, and check it later with ' +
  'get_proposal (pending, applied, failed, rejected, or expired after ' +
  `${AGENT_PROPOSAL_TTL_DAYS} days). Every change is recorded in the activity log, credited ` +
  'to you and the person who connected you (or to the API key), and to whoever approved it. ' +
  'For questions about Crossmart itself (features, plans, how to do something), use ' +
  'ask_crossmart; only when the user asks for a person, hand the conversation to the ' +
  'Crossmart team with escalate_to_crossmart_team.';

/**
 * The tools a credential may use: every tool for an API key (its role decides in the API), and
 * for an agent only those its scopes cover, so it is never offered a tool it cannot call.
 * Without a credential (a local server started without a key), `create_account` as well.
 */
export function toolsFor(credential: ApiCredential | undefined): readonly ApiToolSpec[] {
  if (!credential) return [...ALL_TOOLS, ...ANONYMOUS_TOOLS];
  const scopes = credential.scopes;
  if (!scopes) return ALL_TOOLS;
  return ALL_TOOLS.filter((tool) => tool.scope === undefined || scopes.includes(tool.scope));
}

/** An MCP server whose tools act with one credential; `observer` hears how each call went. */
export function createMcpServer(
  apiUrl: string,
  credential: ApiCredential | undefined,
  observer?: ToolCallObserver,
): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );
  const client = new CrossmartApiClient(apiUrl, credential);
  for (const tool of toolsFor(credential)) registerApiTool(server, tool, client, observer);
  return server;
}
