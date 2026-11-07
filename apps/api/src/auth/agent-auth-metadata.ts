import { VERSIONED_API_PATH } from '@crossmart/common';
import { AGENT_AUTH_SKILL_URL, SANDBOX_CLAIM_PATH } from '@crossmart/core';
import { SANDBOX_ACCOUNTS_ROUTE } from '../sandbox/sandbox.constants.js';
import {
  AgentAuthAssertionType,
  AgentAuthCredentialType,
  AgentAuthIdentityType,
} from './enums/agent-auth.enums.js';

/** The registration method of the `agent_auth` block: the agent asserts the user's email. */
export interface AgentAuthIdentityAssertion {
  assertion_types_supported: AgentAuthAssertionType[];
  credential_types_supported: AgentAuthCredentialType[];
}

/**
 * The `agent_auth` block that auth.md (WorkOS) adds to the authorization server metadata
 * (RFC 8414). It describes the sandbox account (ADR 0019) as the profile's verified-email
 * registration: the agent gives the user's email, Crossmart emails them a claim link, and the
 * agent gets an API key at once.
 *
 * The field names are the profile's v0.1.0 ones (`register_uri`, `claim_uri`,
 * `credential_types_supported`, `verified_email`), which discovery scanners read. v0.2.0 renamed
 * `register_uri` and `claim_uri` to `identity_endpoint` and `claim_endpoint`, and v0.6.0 moved the
 * email path to a `service_auth` type; those are not advertised, because the sandbox endpoint
 * takes Crossmart's own body (`email`, `storeName`), not the profile's, and the claim is a web
 * page for the person, not an endpoint the agent calls. The auth.md file at `skill` documents
 * both. No ID-JAG, revocation URI or security events: Crossmart supports none of them. Token
 * revocation is the standard top-level `revocation_endpoint` (RFC 7009).
 */
export interface AgentAuthMetadata {
  /** The auth.md file: how an agent signs up and authenticates here. */
  skill: string;
  /** Where the agent opens a sandbox account: `POST` with `email` and `storeName`. */
  register_uri: string;
  /** The page where the person claims the account, from the link Crossmart emails them. */
  claim_uri: string;
  identity_types_supported: AgentAuthIdentityType[];
  identity_assertion: AgentAuthIdentityAssertion;
}

/** The authorization server metadata with the `agent_auth` block. */
export interface AuthorizationServerMetadataWithAgentAuth {
  agent_auth: AgentAuthMetadata;
}

/** Where the API and the web app are reached. */
export interface AgentAuthUrls {
  apiPublicUrl: string;
  webAppUrl: string;
}

type FetchHandler = (request: Request) => Promise<Response>;

export function agentAuthMetadata({ apiPublicUrl, webAppUrl }: AgentAuthUrls): AgentAuthMetadata {
  return {
    skill: AGENT_AUTH_SKILL_URL,
    register_uri: new URL(
      `${VERSIONED_API_PATH}/${SANDBOX_ACCOUNTS_ROUTE}`,
      apiPublicUrl,
    ).toString(),
    claim_uri: new URL(SANDBOX_CLAIM_PATH, webAppUrl).toString(),
    identity_types_supported: [AgentAuthIdentityType.IdentityAssertion],
    identity_assertion: {
      assertion_types_supported: [AgentAuthAssertionType.VerifiedEmail],
      credential_types_supported: [AgentAuthCredentialType.ApiKey],
    },
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
