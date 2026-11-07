import { VERSIONED_API_PATH } from '@crossmart/common';
import { AGENT_AUTH_SKILL_URL } from '@crossmart/core';
import { SANDBOX_ACCOUNTS_ROUTE } from '../sandbox/sandbox.constants.js';

/**
 * The `agent_auth` block that auth.md (WorkOS, v0.6.0) adds to the authorization server metadata
 * (RFC 8414). The profile's own registration surface (`/agent/identity`, its claim ceremony and
 * the JWT-bearer and claim grants) is not implemented: agents sign in with OAuth (CIMD, or DCR as
 * a fallback), or open a sandbox account (ADR 0019). So the block names the auth.md file, lists no
 * profile identity types, and adds the sandbox endpoint as an extension field. Agents that follow
 * the profile ignore fields they do not know and read `skill`. Revocation is the standard
 * top-level `revocation_endpoint` (RFC 7009).
 */
export interface AgentAuthMetadata {
  /** The auth.md file: how an agent signs up and authenticates here. */
  skill: string;
  /** The profile's registration types (`anonymous`, `service_auth`, `identity_assertion`). */
  identity_types_supported: string[];
  /** Crossmart's extension: `POST` an email and a store name to open a sandbox account. */
  sandbox_account_endpoint: string;
}

/** The authorization server metadata with the `agent_auth` block. */
export interface AuthorizationServerMetadataWithAgentAuth {
  agent_auth: AgentAuthMetadata;
}

type FetchHandler = (request: Request) => Promise<Response>;

export function agentAuthMetadata(apiPublicUrl: string): AgentAuthMetadata {
  return {
    skill: AGENT_AUTH_SKILL_URL,
    identity_types_supported: [],
    sandbox_account_endpoint: new URL(
      `${VERSIONED_API_PATH}/${SANDBOX_ACCOUNTS_ROUTE}`,
      apiPublicUrl,
    ).toString(),
  };
}

/**
 * Adds the `agent_auth` block to the metadata Better Auth answers, keeping its status and headers
 * (`Cache-Control`). An error answer passes through unchanged.
 */
export function withAgentAuth(
  metadataHandler: FetchHandler,
  agentAuth: AgentAuthMetadata,
): FetchHandler {
  return async (request) => {
    const response = await metadataHandler(request);
    if (!response.ok) return response;
    const metadata = (await response.json()) as Record<string, unknown>;
    const body: AuthorizationServerMetadataWithAgentAuth = { ...metadata, agent_auth: agentAuth };
    return Response.json(body, { status: response.status, headers: response.headers });
  };
}
