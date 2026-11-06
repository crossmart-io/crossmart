import { Injectable, Logger } from '@nestjs/common';
import {
  type ChannelConnector,
  type ChannelType,
  type ChannelWebhookEvent,
  ChannelWebhookKind,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { ChannelEventBus } from '../../events/services/channel-event-bus.js';
import type { ChannelConnectionRecord } from '../repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { connectionSubject } from '../rules/connection-subject.js';

/**
 * Acts on a verified webhook event by its channel-neutral kind. Every handler is idempotent,
 * because channels deliver at least once. Payloads are never logged: they may hold customer data.
 */
@Injectable()
export class ChannelWebhookDispatcher {
  private readonly logger = new Logger(ChannelWebhookDispatcher.name);

  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly activity: ActivityRecorder,
    private readonly events: ChannelEventBus,
  ) {}

  async dispatch(connector: ChannelConnector, event: ChannelWebhookEvent): Promise<void> {
    const account = { channel: connector.channel, externalAccountId: event.externalAccountId };
    switch (event.kind) {
      case ChannelWebhookKind.AccountDisconnected:
        return this.disconnectAccount(connector, account);
      case ChannelWebhookKind.AccountRedactionRequested:
        await this.connections.redactAccount(account, new Date());
        return this.acknowledge(event, 'account data erased');
      case ChannelWebhookKind.OrderChanged:
        return this.orderChanged(account, event.resourceId);
      case ChannelWebhookKind.CustomerDataRequested:
      case ChannelWebhookKind.CustomerRedactionRequested:
        // Orders are stored without buyer details, so there is nothing about a buyer to send or erase.
        return this.acknowledge(event, 'no customer data stored');
      case ChannelWebhookKind.Unhandled:
        return this.acknowledge(event, 'topic not handled');
    }
  }

  /** Every connection of the account reads the order; each may belong to another workspace. */
  private async orderChanged(
    account: { channel: ChannelType; externalAccountId: string },
    externalOrderId: string | undefined,
  ): Promise<void> {
    if (!externalOrderId) return;
    const connections = await this.connections.findByAccount(account);
    for (const connection of connections) {
      if (connection.status !== ChannelConnectionStatus.CONNECTED) continue;
      await this.events.orderChanged({
        workspaceId: connection.workspaceId,
        connectionId: connection.id,
        externalOrderId,
      });
    }
  }

  /** The app was uninstalled: the credentials are dead, so they are wiped everywhere. */
  private async disconnectAccount(
    connector: ChannelConnector,
    account: { channel: ChannelType; externalAccountId: string },
  ): Promise<void> {
    const connected = (await this.connections.findByAccount(account)).filter(
      (connection) => connection.status !== ChannelConnectionStatus.DISCONNECTED,
    );
    for (const connection of connected) {
      await this.connections.markDisconnected(connection.workspaceId, connection.id, new Date());
      await this.recordUninstall(connector, connection);
    }
  }

  private recordUninstall(
    connector: ChannelConnector,
    connection: ChannelConnectionRecord,
  ): Promise<void> {
    return this.activity.record(connection.workspaceId, Actor.system(), {
      action: ActivityAction.ChannelDisconnected,
      subject: connectionSubject(connection),
      detail: connector.displayName,
    });
  }

  private acknowledge(event: ChannelWebhookEvent, outcome: string): void {
    this.logger.log(`Webhook ${event.topic} (${event.deliveryId ?? 'no id'}): ${outcome}`);
  }
}
