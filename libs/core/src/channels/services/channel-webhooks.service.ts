import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ReplayGuard } from '@crossmart/common';
import {
  ChannelCapability,
  type ChannelConnector,
  ChannelConnectorRegistry,
  type ChannelType,
  type ChannelWebhookEvent,
  type IncomingWebhook,
  supportsCapability,
} from '@crossmart/connectors';
import {
  WEBHOOK_DELIVERY_REPLAY_KEY_PREFIX,
  WEBHOOK_DELIVERY_TTL_MS,
} from '../channels.constants.js';
import { ChannelWebhookDispatcher } from './channel-webhook.dispatcher.js';

const INVALID_SIGNATURE = 'Invalid webhook signature';
const DELIVERY_KEY_SEPARATOR = ':';

/**
 * Receives channel webhooks: the connector verifies them, and each delivery id is handled once
 * (a repeat is acknowledged without being handled again) by `ChannelWebhookDispatcher`.
 */
@Injectable()
export class ChannelWebhooksService {
  private readonly logger = new Logger(ChannelWebhooksService.name);

  constructor(
    private readonly registry: ChannelConnectorRegistry,
    private readonly dispatcher: ChannelWebhookDispatcher,
    private readonly deliveries: ReplayGuard,
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
    await this.dispatchOnce(connector, event);
  }

  /** Handles a delivery the first time its id is seen; a failed one is released for a retry. */
  private async dispatchOnce(
    connector: ChannelConnector,
    event: ChannelWebhookEvent,
  ): Promise<void> {
    const key = event.deliveryId
      ? [WEBHOOK_DELIVERY_REPLAY_KEY_PREFIX + connector.channel, event.deliveryId].join(
          DELIVERY_KEY_SEPARATOR,
        )
      : null;
    if (key && !(await this.deliveries.claim(key, WEBHOOK_DELIVERY_TTL_MS))) {
      this.logger.log(`Webhook ${event.topic} (${event.deliveryId}): duplicate, already handled`);
      return;
    }
    try {
      await this.dispatcher.dispatch(connector, event);
    } catch (error) {
      if (key) await this.deliveries.release(key);
      throw error;
    }
  }
}
