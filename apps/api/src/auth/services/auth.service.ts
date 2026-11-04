import { Injectable } from '@nestjs/common';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { AppConfigService } from '@crossmart/common';
import { AccountEmailsService, TenancyProvisioningService } from '@crossmart/core';
import { PrismaService } from '@crossmart/database';
import { type BetterAuthInstance, createBetterAuth } from '../better-auth.factory.js';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { UserPrincipal } from '../entities/principal.js';

type NodeHandler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;

/** Owns the Better Auth instance: sign-up, sign-in and session cookies for the web app. */
@Injectable()
export class AuthService {
  private readonly auth: BetterAuthInstance;

  constructor(
    appConfig: AppConfigService,
    prisma: PrismaService,
    provisioning: TenancyProvisioningService,
    accountEmails: AccountEmailsService,
  ) {
    this.auth = createBetterAuth({
      appConfig,
      prisma,
      onUserCreated: (user) => provisioning.provisionForNewUser(user),
      accountEmails,
    });
  }

  /** The HTTP handler mounted at the auth base path. */
  createHandler(): NodeHandler {
    return toNodeHandler(this.auth);
  }

  async findUserBySession(headers: IncomingHttpHeaders): Promise<UserPrincipal | null> {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
    if (!session) {
      return null;
    }
    const { user } = session;
    return { kind: PrincipalKind.User, userId: user.id, name: user.name, email: user.email };
  }
}
