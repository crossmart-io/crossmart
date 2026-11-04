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
import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import type { PricingContext } from '../entities/price-resolution.js';
import { PricingContextFactory } from './pricing-context.factory.js';

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
    private readonly pricing: PricingContextFactory,
  ) {}

  /** The connection, or null when it is gone or no longer connected: such jobs are dropped. */
  async load(workspaceId: string, connectionId: string): Promise<SyncConnection | null> {
    const view = await this.find(workspaceId, connectionId);
    if (!view || view.status !== ChannelConnectionStatus.CONNECTED) {
      return null;
    }
    return this.toSyncConnection(workspaceId, view);
  }

  /**
   * The connection for API calls: it may be disconnected, but must exist. `rule` prices with a
   * rule being edited instead of the saved one.
   */
  async require(
    workspaceId: string,
    connectionId: string,
    rule?: PricingRule | null,
  ): Promise<SyncConnection> {
    const view = await this.connections.get(workspaceId, connectionId);
    return this.toSyncConnection(workspaceId, view, rule);
  }

  openSession(workspaceId: string, connectionId: string): Promise<ChannelSession> {
    return this.sessions.open(workspaceId, connectionId);
  }

  private async toSyncConnection(
    workspaceId: string,
    view: ChannelConnectionView,
    rule?: PricingRule | null,
  ): Promise<SyncConnection> {
    const pricingRule = rule === undefined ? view.settings.pricing : rule;
    return {
      view,
      connector: this.registry.require(requireEnumValue(ChannelType, view.channel)),
      pricing: await this.pricing.build(workspaceId, view.settings, pricingRule),
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
