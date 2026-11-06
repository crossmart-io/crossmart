import { toCountedPage } from '@crossmart/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { TestEventData } from '../entities/webhook-event-data.js';
import type {
  WebhookDeliveryDetail,
  WebhookDeliveryPage,
  WebhookDeliveryQuery,
  WebhookDeliveryView,
} from '../entities/webhook-delivery-view.js';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import { toWebhookDeliveryDetail, toWebhookDeliveryView } from '../mappers/webhook-view.mapper.js';
import { WebhookJobQueue } from '../queue/webhook-job.queue.js';
import { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import { WebhookEndpointRepository } from '../repositories/webhook-endpoint.repository.js';
import {
  WEBHOOK_DELIVERY_NOT_FOUND,
  WEBHOOK_ENDPOINT_NOT_FOUND,
  WEBHOOK_TEST_MESSAGE,
} from '../webhooks.constants.js';

/**
 * An endpoint's delivery log, and the deliveries a person asks for: a test event, or an event
 * sent again. Both are queued at once and sent by the worker like any other delivery; they
 * reach the endpoint even while it is turned off, so it can be checked before turning it on.
 */
@Injectable()
export class WebhookDeliveriesService {
  constructor(
    private readonly endpoints: WebhookEndpointRepository,
    private readonly deliveries: WebhookDeliveryRepository,
    private readonly queue: WebhookJobQueue,
  ) {}

  async list(
    workspaceId: string,
    endpointId: string,
    query: WebhookDeliveryQuery,
  ): Promise<WebhookDeliveryPage> {
    await this.requireEndpoint(workspaceId, endpointId);
    const page = toCountedPage(
      await this.deliveries.listPage(workspaceId, endpointId, query),
      query.limit,
    );
    return {
      items: page.rows.map(toWebhookDeliveryView),
      nextCursor: page.nextCursor,
      total: page.total,
    };
  }

  async get(
    workspaceId: string,
    endpointId: string,
    deliveryId: string,
  ): Promise<WebhookDeliveryDetail> {
    const row = await this.deliveries.findDetail(workspaceId, endpointId, deliveryId);
    if (!row) throw new NotFoundException(WEBHOOK_DELIVERY_NOT_FOUND);
    return toWebhookDeliveryDetail(row);
  }

  /** Sends the delivery's event again, as a new delivery with the same event id. */
  async redeliver(
    workspaceId: string,
    endpointId: string,
    deliveryId: string,
  ): Promise<WebhookDeliveryView> {
    const original = await this.deliveries.findDetail(workspaceId, endpointId, deliveryId);
    if (!original) throw new NotFoundException(WEBHOOK_DELIVERY_NOT_FOUND);
    const target = { workspaceId, endpointId, eventId: original.eventId };
    const delivery = await this.deliveries.create(target, new Date());
    await this.queue.dispatchSoon();
    return toWebhookDeliveryView(delivery);
  }

  /** Sends a `webhook.test` event to this endpoint only, whatever it subscribes to. */
  async sendTest(workspaceId: string, endpointId: string): Promise<WebhookDeliveryView> {
    await this.requireEndpoint(workspaceId, endpointId);
    const data: TestEventData = { endpointId, message: WEBHOOK_TEST_MESSAGE };
    const delivery = await this.deliveries.createWithEvent(
      { workspaceId, endpointId, type: WebhookEventType.Test, data },
      new Date(),
    );
    await this.queue.dispatchSoon();
    return toWebhookDeliveryView(delivery);
  }

  private async requireEndpoint(workspaceId: string, endpointId: string): Promise<void> {
    if (!(await this.endpoints.find(workspaceId, endpointId))) {
      throw new NotFoundException(WEBHOOK_ENDPOINT_NOT_FOUND);
    }
  }
}
