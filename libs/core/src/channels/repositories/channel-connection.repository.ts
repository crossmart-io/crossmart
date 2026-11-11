import { Injectable } from '@nestjs/common';
import { ChannelConnectionStatus, type Prisma, PrismaService } from '@crossmart/database';
import {
  type ChannelConnectionRecord,
  type ConnectedAccountRecord,
  SEALED_CREDENTIALS_SELECT,
  type SealedCredentialsRecord,
  type UpsertedConnection,
  WITHOUT_CREDENTIALS,
  wipedCredentials,
} from './channel-connection.queries.js';
import {
  lockSettingsKey,
  type SettingsTarget,
  writeSettingsKey,
} from './connection-settings.queries.js';
import type { ConnectionSettings } from '../entities/connection-settings.js';
import { ConnectionSettingsKey } from '../enums/connection-settings-key.enum.js';
import { mergeReconnectedAccount } from '../rules/account-settings-merge.js';

export interface AccountRef {
  channel: string;
  externalAccountId: string;
}

/** Connections the merchant connects again to repair. */
const REPAIRABLE_STATUSES: readonly ChannelConnectionStatus[] = [
  ChannelConnectionStatus.NEEDS_REAUTH,
  ChannelConnectionStatus.ERROR,
];

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
   * Connecting an account again (re-auth) updates its row and keeps its listings and the
   * merchant's rules (product selection, pricing): only the account part of settings changes,
   * merged with the stored account under a row lock (`mergeReconnectedAccount`).
   */
  upsertConnected(record: ConnectedAccountRecord): Promise<UpsertedConnection> {
    const { workspaceId, channel, externalAccountId, sealedCredentials, settings, ...fields } =
      record;
    const key = { workspaceId, channel, externalAccountId };
    return this.prisma.$transaction(async (client) => {
      const stored = await this.lockStoredAccount(client, key);
      const data = {
        ...fields,
        credentials: sealedCredentials,
        status: ChannelConnectionStatus.CONNECTED,
        statusReason: null,
        disconnectedAt: null,
      };
      const connection = await client.channelConnection.upsert({
        where: { workspaceId_channel_externalAccountId: key },
        create: { ...key, ...data, settings },
        update: data,
        omit: WITHOUT_CREDENTIALS,
      });
      if (!stored) return { record: connection, reconnected: false };
      const account = mergeReconnectedAccount(stored.account, settings.account);
      const target = { workspaceId, connectionId: connection.id };
      await writeSettingsKey(client, target, ConnectionSettingsKey.Account, account);
      const merged = await client.channelConnection.findUniqueOrThrow({
        where: { id: connection.id },
        omit: WITHOUT_CREDENTIALS,
      });
      return { record: merged, reconnected: true };
    });
  }

  /** Saves the account part of the settings only; the connector has validated it. */
  saveAccountSettings(
    workspaceId: string,
    connectionId: string,
    account: ConnectionSettings[ConnectionSettingsKey.Account],
  ): Promise<ChannelConnectionRecord | null> {
    return this.saveKey({ workspaceId, connectionId }, ConnectionSettingsKey.Account, account);
  }

  /** Saves the product selection only; the caller has validated it. */
  saveProductSelection(
    workspaceId: string,
    connectionId: string,
    selection: ConnectionSettings[ConnectionSettingsKey.ProductSelection],
  ): Promise<ChannelConnectionRecord | null> {
    const key = ConnectionSettingsKey.ProductSelection;
    return this.saveKey({ workspaceId, connectionId }, key, selection);
  }

  /** Saves the pricing rule only; the caller has validated it. */
  savePricing(
    workspaceId: string,
    connectionId: string,
    pricing: ConnectionSettings[ConnectionSettingsKey.Pricing],
  ): Promise<ChannelConnectionRecord | null> {
    return this.saveKey({ workspaceId, connectionId }, ConnectionSettingsKey.Pricing, pricing);
  }

  /**
   * Changes the product selection from its stored value under a row lock, so two concurrent
   * changes (such as products removed from a store) both apply. `change` may throw to cancel.
   */
  updateProductSelection(
    workspaceId: string,
    connectionId: string,
    change: (stored: unknown) => ConnectionSettings[ConnectionSettingsKey.ProductSelection],
  ): Promise<ChannelConnectionRecord | null> {
    const target = { workspaceId, connectionId };
    const key = ConnectionSettingsKey.ProductSelection;
    return this.prisma.$transaction(async (client) => {
      const stored = await lockSettingsKey(client, target, key);
      if (!stored) return null;
      await writeSettingsKey(client, target, key, change(stored.value));
      return client.channelConnection.findFirst({
        where: { id: connectionId, workspaceId },
        omit: WITHOUT_CREDENTIALS,
      });
    });
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

  /**
   * Every workspace's connections on `channel` whose account id starts with `prefix`, for
   * channels that store one account under several ids (an eBay user on each marketplace).
   */
  findByAccountPrefix(channel: string, prefix: string): Promise<ChannelConnectionRecord[]> {
    return this.prisma.channelConnection.findMany({
      where: { channel, externalAccountId: { startsWith: prefix } },
      omit: WITHOUT_CREDENTIALS,
    });
  }

  /** True when the workspace has this account and has not disconnected it: it holds a plan slot. */
  async holdsSlot(workspaceId: string, account: AccountRef): Promise<boolean> {
    const count = await this.prisma.channelConnection.count({
      where: {
        workspaceId,
        ...accountFilter(account),
        status: { not: ChannelConnectionStatus.DISCONNECTED },
      },
    });
    return count > 0;
  }

  /**
   * True when connecting `handle` on `channel` may repair a connection the workspace holds:
   * the same account, or one that needs signing in again.
   */
  async hasReconnectCandidate(
    workspaceId: string,
    channel: string,
    handle: string,
  ): Promise<boolean> {
    const count = await this.prisma.channelConnection.count({
      where: {
        workspaceId,
        channel,
        OR: [
          { externalAccountId: handle, status: { not: ChannelConnectionStatus.DISCONNECTED } },
          { status: { in: [...REPAIRABLE_STATUSES] } },
        ],
      },
    });
    return count > 0;
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

  /** Throws when the connection is not in the workspace. */
  async saveCredentials(
    { workspaceId, connectionId }: SettingsTarget,
    sealedCredentials: string,
    expiresAt: Date | null,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await client.channelConnection.update({
      where: { id: connectionId, workspaceId },
      data: { credentials: sealedCredentials, credentialsExpiresAt: expiresAt },
    });
  }

  async markNeedsReauth(workspaceId: string, connectionId: string, reason: string): Promise<void> {
    await this.prisma.channelConnection.updateMany({
      where: { id: connectionId, workspaceId },
      data: { status: ChannelConnectionStatus.NEEDS_REAUTH, statusReason: reason },
    });
  }

  /** Records that the channel's catalog was last read into Crossmart at `syncedAt`. */
  /** Starts reading the connection's orders from `at`, unless it already started; returns the start. */
  async startOrderSync(workspaceId: string, connectionId: string, at: Date): Promise<Date> {
    await this.prisma.channelConnection.updateMany({
      where: { id: connectionId, workspaceId, ordersSyncedFrom: null },
      data: { ordersSyncedFrom: at },
    });
    const { ordersSyncedFrom } = await this.prisma.channelConnection.findFirstOrThrow({
      where: { id: connectionId, workspaceId },
      select: { ordersSyncedFrom: true },
    });
    return ordersSyncedFrom ?? at;
  }

  /** Orders changed up to `polledAt` have been read from this connection. */
  async markOrdersPolled(workspaceId: string, connectionId: string, polledAt: Date): Promise<void> {
    await this.prisma.channelConnection.updateMany({
      where: { id: connectionId, workspaceId },
      data: { ordersPolledAt: polledAt },
    });
  }

  async markSynced(workspaceId: string, connectionId: string, syncedAt: Date): Promise<void> {
    await this.prisma.channelConnection.updateMany({
      where: { id: connectionId, workspaceId },
      data: { lastSyncedAt: syncedAt },
    });
  }

  /** Disconnects one connection and wipes its credentials. Throws when it is not in the workspace. */
  async markDisconnected(
    workspaceId: string,
    connectionId: string,
    now: Date,
  ): Promise<ChannelConnectionRecord> {
    return this.prisma.channelConnection.update({
      where: { id: connectionId, workspaceId },
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
   * Erases what Crossmart stored about an account: credentials, settings, scopes, its orders
   * and the listing ids mapped to it, releasing the stock open orders held. Products stay;
   * they belong to the merchant. `displayName` replaces the connection's name when the name
   * itself identifies the person whose data is erased.
   */
  async redactAccount(account: AccountRef, now: Date, displayName?: string): Promise<number> {
    const connection = accountFilter(account);
    const [, , , { count }] = await this.prisma.$transaction([
      // Units the account's open orders still hold go back on sale: Crossmart can no longer
      // follow those orders, and reconciliation sends the new stock to the other channels.
      this.prisma.$executeRaw`
        UPDATE inventory_items i
        SET available = i.available + held.units, reserved = i.reserved - held.units
        FROM (
          SELECT l.variant_id, SUM(l.reserved_quantity)::int AS units
          FROM order_lines l
          JOIN orders o ON o.id = l.order_id
          JOIN channel_connections c ON c.id = o.connection_id
          WHERE c.channel = ${connection.channel} AND c.external_account_id = ${connection.externalAccountId}
            AND l.variant_id IS NOT NULL AND l.reserved_quantity > 0
          GROUP BY l.variant_id
        ) held
        WHERE i.variant_id = held.variant_id AND i.tracked`,
      this.prisma.order.deleteMany({ where: { connection } }),
      this.prisma.listing.deleteMany({ where: { connection } }),
      this.prisma.channelConnection.updateMany({
        where: connection,
        data: {
          ...wipedCredentials(now),
          status: ChannelConnectionStatus.DISCONNECTED,
          statusReason: null,
          grantedScopes: [],
          settings: {},
          ...(displayName === undefined ? {} : { displayName }),
        },
      }),
    ]);
    return count;
  }

  private async saveKey(
    target: SettingsTarget,
    key: ConnectionSettingsKey,
    value: unknown,
  ): Promise<ChannelConnectionRecord | null> {
    const count = await writeSettingsKey(this.prisma, target, key, value);
    return count === 0 ? null : this.findForWorkspace(target.workspaceId, target.connectionId);
  }

  /** Locks an existing connection to the account and returns its stored account settings. */
  private async lockStoredAccount(
    client: Prisma.TransactionClient,
    { workspaceId, channel, externalAccountId }: AccountRef & { workspaceId: string },
  ): Promise<{ account: unknown } | undefined> {
    const [row] = await client.$queryRaw<{ account: unknown }[]>`
      SELECT settings -> ${ConnectionSettingsKey.Account}::text AS account
      FROM channel_connections
      WHERE workspace_id = ${workspaceId}::uuid AND channel = ${channel}
        AND external_account_id = ${externalAccountId}
      FOR UPDATE`;
    return row;
  }
}
