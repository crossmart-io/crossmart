import { AGENT_SCOPES } from '@crossmart/core/agents/agents.constants.js';
import {
  bearerChallenge as resourceBearerChallenge,
  protectedResourceMetadataPaths as resourceMetadataPaths,
} from '@crossmart/core/agents/rules/protected-resource-challenge.js';
import type { McpConfig } from '../config/mcp-config.js';
import { RESOURCE_NAME } from '../mcp.constants.js';

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
  return resourceMetadataPaths(publicUrl);
}

/**
 * The `WWW-Authenticate` value of a 401 (RFC 6750 and RFC 9728): it points to the metadata and
 * names the scopes to ask for. `invalid_token` when a token was sent but refused.
 */
export function bearerChallenge(config: ResourceConfig, tokenRefused: boolean): string {
  return resourceBearerChallenge(config.publicUrl, tokenRefused);
}
