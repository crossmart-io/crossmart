import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireEnumValue } from '@crossmart/common';
import {
  type CatalogSource,
  ChannelCapability,
  type ChannelConnector,
  ChannelConnectorRegistry,
  type ChannelSession,
  ChannelType,
  supportsCapability,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { CONNECTION_NOT_FOUND } from '../../channels.constants.js';
import type { ChannelConnectionRecord } from '../../repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../../repositories/channel-connection.repository.js';
import { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import { CONNECTION_NOT_CONNECTED, IMPORT_NOT_SUPPORTED } from '../channel-import.constants.js';

/** A connection's catalog, ready to read page by page. */
export interface OpenCatalog {
  session: ChannelSession;
  source: CatalogSource;
}

/** Opens an authenticated session on a connection whose connector can import its catalog. */
@Injectable()
export class ChannelCatalogOpener {
  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly sessions: ChannelSessionFactory,
    private readonly registry: ChannelConnectorRegistry,
  ) {}

  /** The connector of a channel, when it can import catalogs; throws otherwise. */
  catalogSourceOf(channel: string): ChannelConnector & CatalogSource {
    const connector = this.registry.require(requireEnumValue(ChannelType, channel));
    if (!supportsCapability(connector, ChannelCapability.ImportCatalog)) {
      throw new BadRequestException(IMPORT_NOT_SUPPORTED);
    }
    return connector;
  }

  /** A connected connection whose catalog can be imported; throws a client error otherwise. */
  async requireImportable(
    workspaceId: string,
    connectionId: string,
  ): Promise<ChannelConnectionRecord> {
    const connection = await this.require(workspaceId, connectionId);
    if (connection.status !== ChannelConnectionStatus.CONNECTED) {
      throw new ConflictException(CONNECTION_NOT_CONNECTED);
    }
    this.catalogSourceOf(connection.channel);
    return connection;
  }

  async open(workspaceId: string, connectionId: string): Promise<OpenCatalog> {
    const connection = await this.require(workspaceId, connectionId);
    const source = this.catalogSourceOf(connection.channel);
    return { session: await this.sessions.open(workspaceId, connectionId), source };
  }

  private async require(
    workspaceId: string,
    connectionId: string,
  ): Promise<ChannelConnectionRecord> {
    const connection = await this.connections.findForWorkspace(workspaceId, connectionId);
    if (!connection) {
      throw new NotFoundException(CONNECTION_NOT_FOUND);
    }
    return connection;
  }
}
