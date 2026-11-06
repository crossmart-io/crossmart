import { Injectable } from '@nestjs/common';
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from '@better-auth/oauth-provider';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import type { JSONWebKeySet } from 'jose';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { AppConfigService } from '@crossmart/common';
import { AccountEmailsService } from '@crossmart/core';
import { PrismaService } from '@crossmart/database';
import { type BetterAuthInstance, createBetterAuth } from '../better-auth.factory.js';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { UserPrincipal } from '../entities/principal.js';
import { AuthTenancyHooks } from './auth-tenancy.hooks.js';

export type NodeHandler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;

/** What agent access tokens are checked against: who issued them, and the keys that sign them. */
export interface AgentTokenKeys {
  issuer: string;
  jwks: JSONWebKeySet;
}

/**
 * Owns the Better Auth instance: sign-up, sign-in and session cookies for the web app, and the
 * OAuth server AI agents connect through.
 */
@Injectable()
export class AuthService {
  private readonly auth: BetterAuthInstance;

  constructor(
    appConfig: AppConfigService,
    private readonly prisma: PrismaService,
    accountEmails: AccountEmailsService,
    tenancy: AuthTenancyHooks,
  ) {
    this.auth = createBetterAuth({
      appConfig,
      prisma,
      onUserCreated: (user) => tenancy.onUserCreated(user),
      accountEmails,
      isWorkspaceMember: (workspaceId, userId) => tenancy.isWorkspaceMember(workspaceId, userId),
    });
  }

  /** The HTTP handler mounted at the auth base path. */
  createHandler(): NodeHandler {
    return toNodeHandler(this.auth);
  }

  /** The OAuth discovery documents, for clients that look for them at the root. */
  createMetadataHandlers(): { authorizationServer: NodeHandler; openIdConfiguration: NodeHandler } {
    return {
      authorizationServer: toNodeHandler(oauthProviderAuthServerMetadata(this.auth)),
      openIdConfiguration: toNodeHandler(oauthProviderOpenIdConfigMetadata(this.auth)),
    };
  }

  async findUserBySession(headers: IncomingHttpHeaders): Promise<UserPrincipal | null> {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
    if (!session) {
      return null;
    }
    const { user } = session;
    return { kind: PrincipalKind.User, userId: user.id, name: user.name, email: user.email };
  }

  /**
   * Remembers, on the signed-in session, the workspace an agent being authorized will work in.
   * The caller has checked that the user belongs to it. False when there is no session.
   */
  async pickAgentWorkspace(headers: IncomingHttpHeaders, workspaceId: string): Promise<boolean> {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
    if (!session) {
      return false;
    }
    await this.prisma.session.update({
      where: { id: session.session.id },
      data: { oauthWorkspaceId: workspaceId },
    });
    return true;
  }

  /** The issuer and public signing keys of agent access tokens. */
  async agentTokenKeys(): Promise<AgentTokenKeys> {
    const [metadata, jwks] = await Promise.all([
      this.auth.api.getOAuthServerConfig(),
      this.auth.api.getJwks(),
    ]);
    return { issuer: metadata.issuer, jwks: jwks as JSONWebKeySet };
  }
}
