import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';

const CONNECTION_INCLUDE = {
  client: { select: { name: true, uri: true, icon: true, disabled: true } },
  user: { select: { name: true, email: true } },
} satisfies Prisma.OauthConsentInclude;

export type AgentConsentRecord = Prisma.OauthConsentGetPayload<{
  include: typeof CONNECTION_INCLUDE;
}>;

/** The connection a token belongs to, as the API checks it on every agent request. */
export interface AgentConnectionKey {
  userId: string;
  clientId: string;
  workspaceId: string;
}

/**
 * Agent connections as Better Auth's OAuth provider stores them: a consent per user, client and
 * workspace (`referenceId`), and the tokens issued under it.
 */
@Injectable()
export class AgentConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findConsent({
    userId,
    clientId,
    workspaceId,
  }: AgentConnectionKey): Promise<AgentConsentRecord | null> {
    return this.prisma.oauthConsent.findFirst({
      where: { userId, clientId, referenceId: workspaceId },
      include: CONNECTION_INCLUDE,
    });
  }

  findById(workspaceId: string, id: string): Promise<AgentConsentRecord | null> {
    return this.prisma.oauthConsent.findFirst({
      where: { id, referenceId: workspaceId },
      include: CONNECTION_INCLUDE,
    });
  }

  /** The workspace's connections, newest first; only `userId`'s when given. */
  list(workspaceId: string, userId?: string): Promise<AgentConsentRecord[]> {
    return this.prisma.oauthConsent.findMany({
      where: { referenceId: workspaceId, ...(userId ? { userId } : {}) },
      include: CONNECTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Ends a connection: drops the consent, revokes its refresh tokens and deletes its stored
   * access tokens, in one transaction. Access tokens already issued stop working at once,
   * because the API checks the consent on every request.
   */
  async revoke({ userId, clientId, workspaceId }: AgentConnectionKey, now: Date): Promise<void> {
    const where = { userId, clientId, referenceId: workspaceId };
    await this.prisma.$transaction([
      this.prisma.oauthConsent.deleteMany({ where }),
      this.prisma.oauthAccessToken.deleteMany({ where }),
      this.prisma.oauthRefreshToken.updateMany({
        where: { ...where, revoked: null },
        data: { revoked: now },
      }),
    ]);
  }

  /**
   * Deletes clients that registered themselves (no metadata document, no owner) before `before`
   * and were never used: no consent, no token, nothing in the activity log. Returns how many.
   */
  async deleteUnusedRegistrations(before: Date): Promise<number> {
    const { count } = await this.prisma.oauthClient.deleteMany({
      where: {
        clientDiscoveryId: null,
        userId: null,
        createdAt: { lt: before },
        consents: { none: {} },
        refreshTokens: { none: {} },
        accessTokens: { none: {} },
        activity: { none: {} },
      },
    });
    return count;
  }
}
