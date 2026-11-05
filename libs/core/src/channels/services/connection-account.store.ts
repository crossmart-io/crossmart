import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChannelSettings } from '@crossmart/connectors';
import { CONNECTION_NOT_FOUND } from '../channels.constants.js';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { ChannelConnectionsService } from './channel-connections.service.js';

/**
 * Reads a connection and replaces the account part of its settings. Only the account key is
 * written, so the merchant's rules saved meanwhile (pricing, selection) are never reverted.
 */
@Injectable()
export class ConnectionAccountStore {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly records: ChannelConnectionRepository,
  ) {}

  get(workspaceId: string, connectionId: string): Promise<ChannelConnectionView> {
    return this.connections.get(workspaceId, connectionId);
  }

  /** Saves `account` as the connection's account settings; the connector validated them. */
  async saveAccount(
    workspaceId: string,
    connection: ChannelConnectionView,
    account: ChannelSettings,
  ): Promise<ChannelConnectionView> {
    const saved = await this.records.saveAccountSettings(workspaceId, connection.id, account);
    if (!saved) {
      throw new NotFoundException(CONNECTION_NOT_FOUND);
    }
    return this.connections.get(workspaceId, connection.id);
  }
}
