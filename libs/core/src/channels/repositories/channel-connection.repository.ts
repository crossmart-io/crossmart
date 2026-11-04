import { Injectable } from '@nestjs/common';
import { ChannelConnectionStatus, type Prisma, PrismaService } from '@crossmart/database';
import {
  type ChannelConnectionRecord,
  type ConnectedAccountRecord,
  SEALED_CREDENTIALS_SELECT,
  type SealedCredentialsRecord,
  WITHOUT_CREDENTIALS,
  wipedCredentials,
} from './channel-connection.queries.js';

export interface AccountRef {
  channel: string;
  externalAccountId: string;
}

function isJsonObject(value: Prisma.JsonValue | undefined): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The new account settings over the stored ones, so the merchant's rules survive a re-auth. */
function keepMerchantRules(
  stored: Prisma.JsonValue | undefined,
  incoming: Prisma.InputJsonObject,
): Prisma.InputJsonObject {
  return isJsonObject(stored) ? { ...stored, account: incoming.account } : incoming;
}

/** Only the account's identity, so passing a whole record never widens the filter. */
function accountFilter({ channel, externalAccountId }: AccountRef): AccountRef {
  return { channel, externalAccountId };
}

/**
 * Channel connections. Reads leave the sealed credentials out unless a method is explicitly
 * about credentials, so they cannot reach an API response by accident.
 */
@Injectable()
export class ChannelConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Connecting an account again (re-auth) updates its row and keeps its listings, and the
   * merchant's rules (product selection, pricing): only the account part of settings changes.
   */
  upsertConnected(record: ConnectedAccountRecord): Promise<ChannelConnectionRecord> {
    const { workspaceId, channel, externalAccountId, sealedCredentials, settings, ...fields } =
      record;
    const key = { workspaceId, channel, externalAccountId };
    return this.prisma.$transaction(async (client) => {
      const existing = await client.channelConnection.findUnique({
        where: { workspaceId_channel_externalAccountId: key },
        select: { settings: true },
      });
      const data = {
        ...fields,
        credentials: sealedCredentials,
        status: ChannelConnectionStatus.CONNECTED,
        statusReason: null,
        disconnectedAt: null,
      };
      return client.channelConnection.upsert({
        where: { workspaceId_channel_externalAccountId: key },
        create: { ...key, ...data, settings },
        update: { ...data, settings: keepMerchantRules(existing?.settings, settings) },
        omit: WITHOUT_CREDENTIALS,
      });
    });
  }

  /** Replaces the connection's settings; the caller has validated them. */
  async saveSettings(
    workspaceId: string,
    connectionId: string,
    settings: Prisma.InputJsonObject,
  ): Promise<ChannelConnectionRecord | null> {
    const { count } = await this.prisma.channelConnection.updateMany({
      where: { id: connectionId, workspaceId },
      data: { settings },
    });
    return count === 0 ? null : this.findForWorkspace(workspaceId, connectionId);
  }

  /** Connections that hold working credentials, for scheduled reconciliation. */
  listConnected(): Promise<ChannelConnectionRecord[]> {
    return this.prisma.channelConnection.findMany({
      where: { status: ChannelConnectionStatus.CONNECTED, credentials: { not: null } },
      omit: WITHOUT_CREDENTIALS,
    });
  }

  listForWorkspace(workspaceId: string): Promise<ChannelConnectionRecord[]> {
    return this.prisma.channelConnection.findMany({
      where: { workspaceId },
      orderBy: [{ connectedAt: 'asc' }, { id: 'asc' }],
      omit: WITHOUT_CREDENTIALS,
    });
  }

  findForWorkspace(
    workspaceId: string,
    connectionId: string,
  ): Promise<ChannelConnectionRecord | null> {
    return this.prisma.channelConnection.findFirst({
      where: { id: connectionId, workspaceId },
      omit: WITHOUT_CREDENTIALS,
    });
  }

  /** Every workspace's connection to an account; webhooks name accounts, not workspaces. */
  findByAccount(account: AccountRef): Promise<ChannelConnectionRecord[]> {
    return this.prisma.channelConnection.findMany({
      where: accountFilter(account),
      omit: WITHOUT_CREDENTIALS,
    });
  }

  /** Other connections that still hold working credentials for the same account. */
  countOtherActive(account: AccountRef, connectionId: string): Promise<number> {
    return this.prisma.channelConnection.count({
      where: { ...accountFilter(account), id: { not: connectionId }, credentials: { not: null } },
    });
  }

  findSealedCredentials(
    connectionId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<SealedCredentialsRecord | null> {
    return client.channelConnection.findUnique({
      where: { id: connectionId },
      select: SEALED_CREDENTIALS_SELECT,
    });
  }

  async saveCredentials(
    connectionId: string,
    sealedCredentials: string,
    expiresAt: Date | null,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await client.channelConnection.update({
      where: { id: connectionId },
      data: { credentials: sealedCredentials, credentialsExpiresAt: expiresAt },
    });
  }

  async markNeedsReauth(connectionId: string, reason: string): Promise<void> {
    await this.prisma.channelConnection.update({
      where: { id: connectionId },
      data: { status: ChannelConnectionStatus.NEEDS_REAUTH, statusReason: reason },
    });
  }

  /** Records that the channel's catalog was last read into Crossmart at `syncedAt`. */
  async markSynced(workspaceId: string, connectionId: string, syncedAt: Date): Promise<void> {
    await this.prisma.channelConnection.updateMany({
      where: { id: connectionId, workspaceId },
      data: { lastSyncedAt: syncedAt },
    });
  }

  /** Disconnects one connection and wipes its credentials. */
  async markDisconnected(connectionId: string, now: Date): Promise<ChannelConnectionRecord> {
    return this.prisma.channelConnection.update({
      where: { id: connectionId },
      data: {
        ...wipedCredentials(now),
        status: ChannelConnectionStatus.DISCONNECTED,
        statusReason: null,
      },
      omit: WITHOUT_CREDENTIALS,
    });
  }

  /**
   * Runs `work` holding a transaction-scoped advisory lock on the connection, so the API and
   * workers never refresh one connection's token at the same time.
   */
  withCredentialsLock<TResult>(
    connectionId: string,
    work: (client: Prisma.TransactionClient) => Promise<TResult>,
  ): Promise<TResult> {
    return this.prisma.$transaction(async (client) => {
      await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${connectionId}))`;
      return work(client);
    });
  }

  /**
   * Erases what Crossmart stored about an account: credentials, settings, scopes and the
   * listing ids mapped to it. Products stay; they belong to the merchant.
   */
  async redactAccount(account: AccountRef, now: Date): Promise<number> {
    const [, { count }] = await this.prisma.$transaction([
      this.prisma.listing.deleteMany({ where: { connection: accountFilter(account) } }),
      this.prisma.channelConnection.updateMany({
        where: accountFilter(account),
        data: {
          ...wipedCredentials(now),
          status: ChannelConnectionStatus.DISCONNECTED,
          statusReason: null,
          grantedScopes: [],
          settings: {},
        },
      }),
    ]);
    return count;
  }
}
