import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { describeError, requireEnumValue } from '@crossmart/common';
import {
  type ChannelConnector,
  ChannelConnectorRegistry,
  ChannelType,
  isOAuthAppConnector,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { CONNECTION_NOT_FOUND } from '../channels.constants.js';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';
import { toChannelConnectionView } from '../mappers/channel-connection.mapper.js';
import type { ChannelConnectionRecord } from '../repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { ChannelSessionFactory } from './channel-session.factory.js';

/** A workspace's channel connections: listing them, and disconnecting them. */
@Injectable()
export class ChannelConnectionsService {
  private readonly logger = new Logger(ChannelConnectionsService.name);

  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly sessions: ChannelSessionFactory,
    private readonly registry: ChannelConnectorRegistry,
    private readonly activity: ActivityRecorder,
  ) {}

  async list(workspaceId: string): Promise<ChannelConnectionView[]> {
    const records = await this.connections.listForWorkspace(workspaceId);
    return records.map((record) => this.toView(record));
  }

  async get(workspaceId: string, connectionId: string): Promise<ChannelConnectionView> {
    return this.toView(await this.require(workspaceId, connectionId));
  }

  /**
   * Revokes Crossmart's access on the channel (when no other workspace still uses the same
   * account), then wipes the credentials. A failed revocation never keeps the credentials.
   */
  async disconnect(
    workspaceId: string,
    connectionId: string,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const connection = await this.require(workspaceId, connectionId);
    if (connection.status === ChannelConnectionStatus.DISCONNECTED) {
      return this.toView(connection);
    }
    await this.revokeIfLastConnection(connection);
    const disconnected = await this.connections.markDisconnected(
      workspaceId,
      connectionId,
      new Date(),
    );
    await this.activity.record(workspaceId, actor, {
      action: ActivityAction.ChannelDisconnected,
      subject: {
        type: ActivitySubjectType.ChannelConnection,
        id: connectionId,
        label: connection.displayName,
      },
      detail: this.connectorOf(connection).displayName,
    });
    return this.toView(disconnected);
  }

  private async revokeIfLastConnection(connection: ChannelConnectionRecord): Promise<void> {
    const connector = this.connectorOf(connection);
    const sharedWith = await this.connections.countOtherActive(connection, connection.id);
    if (!isOAuthAppConnector(connector) || sharedWith > 0) {
      return;
    }
    try {
      await connector.revokeAccess(await this.sessions.open(connection.workspaceId, connection.id));
    } catch (error) {
      const reason = describeError(error);
      this.logger.warn(`Could not revoke access of connection ${connection.id}: ${reason}`);
    }
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

  private connectorOf(connection: ChannelConnectionRecord): ChannelConnector {
    return this.registry.require(requireEnumValue(ChannelType, connection.channel));
  }

  private toView(record: ChannelConnectionRecord): ChannelConnectionView {
    return toChannelConnectionView(record, this.connectorOf(record));
  }
}
