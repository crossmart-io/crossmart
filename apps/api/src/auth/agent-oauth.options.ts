import { cimd } from '@better-auth/cimd';
import { fetchClientMetadataResource } from '@better-auth/cimd/node';
import { mcp } from '@better-auth/mcp';
import type { OAuthOptions, Scope } from '@better-auth/oauth-provider';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { jwt } from 'better-auth/plugins';
import type { AppConfigService } from '@crossmart/common';
import {
  AGENT_SCOPES,
  AGENT_WORKSPACE_CLAIM,
  OFFLINE_ACCESS_SCOPE,
  OPENID_SCOPES,
} from '@crossmart/core';
import {
  CIMD_METADATA_PROFILE,
  OAUTH_GRANT_TYPES,
  OAUTH_PUBLIC_CLIENT_AUTH_METHOD,
  OAUTH_REGISTER_PATH,
  OAUTH_WEB_PAGES,
} from './auth.constants.js';

/** Answers whether a user belongs to a workspace, to accept it as an agent's workspace. */
export type WorkspaceMembershipCheck = (workspaceId: string, userId: string) => Promise<boolean>;

/** The session field holding the workspace picked for an agent during authorization. */
export const OAUTH_WORKSPACE_SESSION_FIELD = 'oauthWorkspaceId';

/** The only client action a signed-in user may take: reading a client's public details. */
const OAUTH_CLIENT_READ_ACTION = 'read';

/** How the MCP server appears as a protected resource. */
const MCP_RESOURCE_NAME = 'Crossmart MCP server';

const AGENT_TOKEN_SCOPES = [...OPENID_SCOPES, OFFLINE_ACCESS_SCOPE, ...AGENT_SCOPES];

function pickedWorkspace(session: Record<string, unknown>): string | undefined {
  const workspaceId = session[OAUTH_WORKSPACE_SESSION_FIELD];
  return typeof workspaceId === 'string' && workspaceId ? workspaceId : undefined;
}

/**
 * The step between sign-in and consent where the user picks the agent's workspace. It is shown
 * every time, and passes only when the web app continues the flow after a workspace the user
 * belongs to was saved on the session; consent is then stored per that workspace.
 */
type PostLoginStep = NonNullable<OAuthOptions<Scope[]>['postLogin']>;

function workspacePickStep(
  page: string,
  isWorkspaceMember: WorkspaceMembershipCheck,
): PostLoginStep {
  return {
    page,
    consentReferenceId: ({ session }) => {
      const workspaceId = pickedWorkspace(session);
      if (!workspaceId) {
        throw new APIError('BAD_REQUEST', { message: 'Pick a workspace for the agent first' });
      }
      return workspaceId;
    },
    shouldRedirect: async ({ session, user, isContinuation }) => {
      const workspaceId = pickedWorkspace(session);
      const picked =
        isContinuation &&
        workspaceId !== undefined &&
        (await isWorkspaceMember(workspaceId, user.id));
      return !picked;
    },
  };
}

/**
 * The OAuth authorization server for AI agents (ADR 0019): `mcp()` issues tokens bound to the MCP
 * server, `cimd()` identifies clients by their metadata documents, and dynamic registration
 * stays open for public clients only. Each grant names one workspace, picked after sign-in.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- the inferred type carries Better Auth's plugin typings
export function agentOAuthPlugins(
  appConfig: AppConfigService,
  isWorkspaceMember: WorkspaceMembershipCheck,
) {
  const page = (path: string): string => new URL(path, appConfig.webAppUrl).toString();
  return [
    jwt(),
    mcp({
      resource: appConfig.mcpPublicUrl,
      // Stated in full: Prisma cannot store an unset (null) scope list, which would mean "any".
      resources: [
        {
          identifier: appConfig.mcpPublicUrl,
          name: MCP_RESOURCE_NAME,
          allowedScopes: AGENT_TOKEN_SCOPES,
        },
      ],
      loginPage: page(OAUTH_WEB_PAGES.signIn),
      consentPage: page(OAUTH_WEB_PAGES.consent),
      scopes: AGENT_TOKEN_SCOPES,
      grantTypes: [...OAUTH_GRANT_TYPES],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      // Desktop agents (Claude Code, Cursor) register loopback redirects: those are native clients.
      clientRegistrationDefaultApplicationType: 'infer',
      // Clients register themselves or come from metadata documents; nobody manages them by hand.
      clientPrivileges: ({ action }) => action === OAUTH_CLIENT_READ_ACTION,
      clientRegistrationAllowedScopes: AGENT_TOKEN_SCOPES,
      clientRegistrationDefaultScopes: AGENT_TOKEN_SCOPES,
      postLogin: workspacePickStep(page(OAUTH_WEB_PAGES.workspace), isWorkspaceMember),
      customAccessTokenClaims: ({ referenceId }) =>
        referenceId ? { [AGENT_WORKSPACE_CLAIM]: referenceId } : {},
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: CIMD_METADATA_PROFILE }),
  ];
}

/** Better Auth session field for the workspace picked during an agent's authorization. */
export const AGENT_OAUTH_SESSION_FIELDS = {
  [OAUTH_WORKSPACE_SESSION_FIELD]: { type: 'string', required: false, input: false },
} as const;

/**
 * Refuses dynamic registrations of confidential clients: without a signed-in user, only public
 * clients (PKCE, no secret) may register, so a registration never mints a secret.
 */
export const publicClientRegistrationOnly = createAuthMiddleware(async (context) => {
  if (context.path !== OAUTH_REGISTER_PATH) return;
  const body = context.body as { token_endpoint_auth_method?: unknown } | undefined;
  if (body?.token_endpoint_auth_method !== OAUTH_PUBLIC_CLIENT_AUTH_METHOD) {
    throw new APIError('BAD_REQUEST', {
      error: 'invalid_client_metadata',
      error_description: `Register a public client: token_endpoint_auth_method must be "${OAUTH_PUBLIC_CLIENT_AUTH_METHOD}"`,
    });
  }
});
