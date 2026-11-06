import { AGENT_SCOPES } from '@crossmart/core/agents/agents.constants.js';
import type { McpConfig } from '../config/mcp-config.js';
import {
  BEARER_PREFIX,
  PROTECTED_RESOURCE_METADATA_PATH,
  RESOURCE_NAME,
  SCOPE_SEPARATOR,
} from '../mcp.constants.js';

type ResourceConfig = Pick<McpConfig, 'authIssuer' | 'publicUrl'>;

/** RFC 9728 Protected Resource Metadata: how an MCP client finds where to sign in. */
export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: string[];
  resource_name: string;
}

export function protectedResourceMetadata(config: ResourceConfig): ProtectedResourceMetadata {
  return {
    resource: config.publicUrl,
    authorization_servers: [config.authIssuer],
    scopes_supported: [...AGENT_SCOPES],
    bearer_methods_supported: ['header'],
    resource_name: RESOURCE_NAME,
  };
}

/** Where the metadata is served for a resource URL: the well-known path, then the resource's. */
export function protectedResourceMetadataPaths(publicUrl: string): string[] {
  const { pathname } = new URL(publicUrl);
  return [`${PROTECTED_RESOURCE_METADATA_PATH}${pathname}`, PROTECTED_RESOURCE_METADATA_PATH];
}

/**
 * The `WWW-Authenticate` value of a 401 (RFC 6750 and RFC 9728): it points to the metadata and
 * names the scopes to ask for. `invalid_token` when a token was sent but refused.
 */
export function bearerChallenge(config: ResourceConfig, tokenRefused: boolean): string {
  const { origin } = new URL(config.publicUrl);
  const [metadataPath] = protectedResourceMetadataPaths(config.publicUrl);
  const parameters = [
    ...(tokenRefused ? ['error="invalid_token"'] : []),
    `resource_metadata="${origin}${metadataPath}"`,
    `scope="${AGENT_SCOPES.join(SCOPE_SEPARATOR)}"`,
  ];
  return `${BEARER_PREFIX}${parameters.join(', ')}`;
}
