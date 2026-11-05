import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  ChannelCapability,
  type ChannelConnector,
  ChannelConnectorRegistry,
  type ChannelType,
  type ChannelWebhookEvent,
  ChannelWebhookKind,
  type IncomingWebhook,
  supportsCapability,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { ChannelEventBus } from '../../events/services/channel-event-bus.js';
import type { ChannelConnectionRecord } from '../repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';

const INVALID_SIGNATURE = 'Invalid webhook signature';

/**
 * Handles verified channel webhooks. Every handler is idempotent, because channels deliver
 * at least once. Payloads are never logged: they may hold customer data.
 */
@Injectable()
export class ChannelWebhooksService {
  private readonly logger = new Logger(ChannelWebhooksService.name);

  constructor(
    private readonly registry: ChannelConnectorRegistry,
    private readonly connections: ChannelConnectionRepository,
    private readonly activity: ActivityRecorder,
    private readonly events: ChannelEventBus,
  ) {}

  /** Throws 401 when the signature does not verify; otherwise acknowledges every topic. */
  async handle(channel: ChannelType, webhook: IncomingWebhook): Promise<void> {
    const connector = this.registry.require(channel);
    if (!supportsCapability(connector, ChannelCapability.ReceiveWebhooks)) {
      throw new NotFoundException(`${connector.displayName} does not send webhooks`);
    }
    const event = connector.verifyWebhook(webhook);
    if (!event) {
      throw new UnauthorizedException(INVALID_SIGNATURE);
    }
    await this.dispatch(connector, event);
  }

  private async dispatch(connector: ChannelConnector, event: ChannelWebhookEvent): Promise<void> {
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
      subject: {
        type: ActivitySubjectType.ChannelConnection,
        id: connection.id,
        label: connection.displayName,
      },
      detail: connector.displayName,
    });
  }

  private acknowledge(event: ChannelWebhookEvent, outcome: string): void {
    this.logger.log(`Webhook ${event.topic} (${event.deliveryId ?? 'no id'}): ${outcome}`);
  }
}
