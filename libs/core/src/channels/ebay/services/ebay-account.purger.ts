import { Injectable } from '@nestjs/common';
import {
  ChannelType,
  EBAY_ACCOUNT_ID_SEPARATOR,
  EBAY_DISPLAY_NAME_SEPARATOR,
  EBAY_MARKETPLACES,
  type EbayAccountId,
  parseEbayAccountId,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../../activity/entities/actor.js';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../../activity/services/activity-recorder.js';
import { EBAY_DELETED_ACCOUNT_NAME } from '../../channels.constants.js';
import type { ChannelConnectionRecord } from '../../repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../../repositories/channel-connection.repository.js';

/** A user's connections on one marketplace: one stored account, in any number of workspaces. */
interface EbayAccountConnections {
  externalAccountId: string;
  account: EbayAccountId;
  connections: ChannelConnectionRecord[];
}

/**
 * Erases what Crossmart stored about an eBay user who deleted their eBay account: on every
 * marketplace and in every workspace, the connection is disconnected, its credentials, settings
 * and orders are deleted, its listings' eBay ids are dropped, and the username leaves its name.
 * Products stay; they belong to the merchant. Running it again changes nothing.
 */
@Injectable()
export class EbayAccountPurger {
  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  /** Purges the user's accounts; returns how many connections held them. */
  async purge(userId: string, now = new Date()): Promise<number> {
    const accounts = await this.findAccounts(userId);
    for (const account of accounts) {
      await this.purgeAccount(account, now);
    }
    return accounts.reduce((total, { connections }) => total + connections.length, 0);
  }

  /** `externalAccountId` is `{userId}:{marketplaceId}`; the prefix is checked again exactly. */
  private async findAccounts(userId: string): Promise<EbayAccountConnections[]> {
    const prefix = `${userId}${EBAY_ACCOUNT_ID_SEPARATOR}`;
    const found = await this.connections.findByAccountPrefix(ChannelType.Ebay, prefix);
    const byAccount = new Map<string, EbayAccountConnections>();
    for (const connection of found) {
      const account = parseEbayAccountId(connection.externalAccountId);
      if (account?.userId !== userId) continue;
      const { externalAccountId } = connection;
      const entry = byAccount.get(externalAccountId) ?? {
        externalAccountId,
        account,
        connections: [],
      };
      entry.connections.push(connection);
      byAccount.set(externalAccountId, entry);
    }
    return [...byAccount.values()];
  }

  private async purgeAccount(entry: EbayAccountConnections, now: Date): Promise<void> {
    const displayName = this.deletedAccountName(entry.account);
    await this.connections.redactAccount(
      { channel: ChannelType.Ebay, externalAccountId: entry.externalAccountId },
      now,
      displayName,
    );
    const wereActive = entry.connections.filter(
      (connection) => connection.status !== ChannelConnectionStatus.DISCONNECTED,
    );
    for (const connection of wereActive) {
      await this.recordDisconnect(connection, displayName);
    }
  }

  /** `Deleted eBay account · eBay US`: the marketplace stays, so merchants know which one it was. */
  private deletedAccountName({ marketplaceId }: EbayAccountId): string {
    const { siteLabel } = EBAY_MARKETPLACES[marketplaceId];
    return `${EBAY_DELETED_ACCOUNT_NAME}${EBAY_DISPLAY_NAME_SEPARATOR}${siteLabel}`;
  }

  private recordDisconnect(connection: ChannelConnectionRecord, label: string): Promise<void> {
    return this.activity.record(connection.workspaceId, Actor.system(), {
      action: ActivityAction.ChannelDisconnected,
      subject: { type: ActivitySubjectType.ChannelConnection, id: connection.id, label },
      detail: EBAY_DELETED_ACCOUNT_NAME,
    });
  }
}
