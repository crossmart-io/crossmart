import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { AgentClientWorkspace, StaleAgentClient } from '../entities/agent-client-sweep.js';
import type { AgentClientDetails } from '../rules/agent-client-profile.js';
import { agentClientName } from '../rules/agent-client-name.js';

/** The fields access and refresh tokens share, enough to tell when one was last of use. */
type TokenWhere = Prisma.OauthAccessTokenWhereInput & Prisma.OauthRefreshTokenWhereInput;

/** Tokens that still work at `now`, or were issued since `cutoff`: either means recent use. */
function liveOrRecentTokens(cutoff: Date, now: Date): TokenWhere {
  return { OR: [{ expiresAt: { gt: now } }, { createdAt: { gte: cutoff } }] };
}

/**
 * A client nobody owns and nobody has used since `cutoff`: no consent (a consent is a live
 * connection), no refresh or access token that still works or was issued since, no activity
 * since, and no change to the client record since.
 */
function staleClientWhere(cutoff: Date, now: Date): Prisma.OauthClientWhereInput {
  return {
    userId: null,
    createdAt: { lt: cutoff },
    OR: [{ updatedAt: null }, { updatedAt: { lt: cutoff } }],
    consents: { none: {} },
    refreshTokens: { none: liveOrRecentTokens(cutoff, now) },
    accessTokens: { none: liveOrRecentTokens(cutoff, now) },
    activity: { none: { createdAt: { gte: cutoff } } },
  };
}

/** OAuth clients as Better Auth's provider stores them: their public details, and the sweep. */
@Injectable()
export class AgentClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** A client that is not disabled, with what a person may see of it. */
  findEnabled(clientId: string): Promise<AgentClientDetails | null> {
    return this.prisma.oauthClient.findFirst({
      where: { clientId, disabled: { not: true } },
      select: { clientId: true, name: true, uri: true, clientDiscoveryId: true },
    });
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

  /** Up to `limit` clients unused since `cutoff` (see `staleClientWhere`), oldest first. */
  async findStale(cutoff: Date, now: Date, limit: number): Promise<StaleAgentClient[]> {
    const clients = await this.prisma.oauthClient.findMany({
      where: staleClientWhere(cutoff, now),
      select: { clientId: true, name: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return clients.map(({ clientId, name }) => ({
      clientId,
      name: agentClientName(clientId, name),
    }));
  }

  /** The workspaces each client ever acted in, from the activity log. */
  async findWorkspacesActedIn(clientIds: string[]): Promise<AgentClientWorkspace[]> {
    const groups = await this.prisma.activityEvent.groupBy({
      by: ['actorOAuthClientId', 'workspaceId'],
      where: { actorOAuthClientId: { in: clientIds } },
    });
    return groups.flatMap(({ actorOAuthClientId, workspaceId }) =>
      actorOAuthClientId ? [{ clientId: actorOAuthClientId, workspaceId }] : [],
    );
  }

  /**
   * Deletes `clients` that are still stale, in one transaction. The activity events of those in
   * `withActivity` keep the agent's name first, as deleting the client unlinks them. Their
   * consents and tokens go with the client. Returns how many were deleted.
   */
  async deleteStale(
    clients: StaleAgentClient[],
    withActivity: ReadonlySet<string>,
    cutoff: Date,
    now: Date,
  ): Promise<number> {
    const keepNames = clients
      .filter(({ clientId }) => withActivity.has(clientId))
      .map(({ clientId, name }) =>
        this.prisma.activityEvent.updateMany({
          where: { actorOAuthClientId: clientId },
          data: { actorAgentName: name },
        }),
      );
    const clientIds = clients.map(({ clientId }) => clientId);
    const deletion = this.prisma.oauthClient.deleteMany({
      where: { clientId: { in: clientIds }, ...staleClientWhere(cutoff, now) },
    });
    const results = await this.prisma.$transaction([...keepNames, deletion]);
    return results.at(-1)?.count ?? 0;
  }
}
