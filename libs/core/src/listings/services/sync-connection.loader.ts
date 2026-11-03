import { Injectable, NotFoundException } from '@nestjs/common';
import { requireEnumValue } from '@crossmart/common';
import {
  type ChannelConnector,
  ChannelConnectorRegistry,
  type ChannelSession,
  ChannelType,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { ChannelSessionFactory } from '../../channels/services/channel-session.factory.js';
import type { PricingContext } from '../entities/price-resolution.js';
import { pricingContextOf } from '../rules/connection-currency.js';

/** A connection a sync can run on: its settings, connector and pricing. */
export interface SyncConnection {
  view: ChannelConnectionView;
  connector: ChannelConnector;
  pricing: PricingContext;
}

/** Loads what every sync job needs about its connection, and opens sessions on it. */
@Injectable()
export class SyncConnectionLoader {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly registry: ChannelConnectorRegistry,
    private readonly sessions: ChannelSessionFactory,
  ) {}

  /** The connection, or null when it is gone or no longer connected: such jobs are dropped. */
  async load(workspaceId: string, connectionId: string): Promise<SyncConnection | null> {
    const view = await this.find(workspaceId, connectionId);
    if (!view || view.status !== ChannelConnectionStatus.CONNECTED) {
      return null;
    }
    return this.toSyncConnection(view);
  }

  /** The connection for API calls: it may be disconnected, but must exist. */
  async require(workspaceId: string, connectionId: string): Promise<SyncConnection> {
    return this.toSyncConnection(await this.connections.get(workspaceId, connectionId));
  }

  openSession(workspaceId: string, connectionId: string): Promise<ChannelSession> {
    return this.sessions.open(workspaceId, connectionId);
  }

  private toSyncConnection(view: ChannelConnectionView): SyncConnection {
    return {
      view,
      connector: this.registry.require(requireEnumValue(ChannelType, view.channel)),
      pricing: pricingContextOf(view.settings),
    };
  }

  private async find(
    workspaceId: string,
    connectionId: string,
  ): Promise<ChannelConnectionView | null> {
    try {
      return await this.connections.get(workspaceId, connectionId);
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
