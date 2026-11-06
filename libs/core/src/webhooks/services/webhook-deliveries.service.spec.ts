import { NotFoundException } from '@nestjs/common';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import type { WebhookJobQueue } from '../queue/webhook-job.queue.js';
import type { DeliveryRow } from '../repositories/webhook-delivery.queries.js';
import type { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import type { WebhookEndpointRepository } from '../repositories/webhook-endpoint.repository.js';
import {
  deliveryDetailRow,
  deliveryRow,
  storedEndpoint,
  TEST_DELIVERY_ID,
  TEST_ENDPOINT_ID,
  TEST_EVENT_ID,
  TEST_WORKSPACE_ID,
} from '../testing/webhook-fixtures.js';
import { WEBHOOK_DELIVERY_NOT_FOUND, WEBHOOK_TEST_MESSAGE } from '../webhooks.constants.js';
import { WebhookDeliveriesService } from './webhook-deliveries.service.js';

const NEW_DELIVERY_ID = '00000000-0000-4000-8000-0000000000d2';

function createService(endpointExists = true) {
  const endpoints = {
    find: vi
      .fn<WebhookEndpointRepository['find']>()
      .mockResolvedValue(endpointExists ? storedEndpoint() : null),
  };
  const deliveries = {
    listPage: vi.fn<WebhookDeliveryRepository['listPage']>(),
    findDetail: vi.fn<WebhookDeliveryRepository['findDetail']>().mockResolvedValue(null),
    create: vi
      .fn<WebhookDeliveryRepository['create']>()
      .mockResolvedValue(deliveryRow({ id: NEW_DELIVERY_ID })),
    createWithEvent: vi
      .fn<WebhookDeliveryRepository['createWithEvent']>()
      .mockResolvedValue(deliveryRow({ id: NEW_DELIVERY_ID })),
  };
  const queue = {
    deliverAll: vi.fn<WebhookJobQueue['deliverAll']>(),
    dispatchSoon: vi.fn<WebhookJobQueue['dispatchSoon']>().mockResolvedValue(),
  };
  const service = new WebhookDeliveriesService(
    endpoints as unknown as WebhookEndpointRepository,
    deliveries as unknown as WebhookDeliveryRepository,
    queue as unknown as WebhookJobQueue,
  );
  return { service, deliveries, queue };
}

const QUERY = { limit: 2 };

describe('WebhookDeliveriesService.list', () => {
  it('answers 404 for an endpoint the workspace does not have', async () => {
    const { service, deliveries } = createService(false);

    await expect(service.list(TEST_WORKSPACE_ID, 'other', QUERY)).rejects.toThrow(
      NotFoundException,
    );
    expect(deliveries.listPage).not.toHaveBeenCalled();
  });

  it('maps a page of deliveries and points to the next one', async () => {
    const { service, deliveries } = createService();
    const records: DeliveryRow[] = ['d-1', 'd-2', 'd-3'].map((id) => deliveryRow({ id }));
    deliveries.listPage.mockResolvedValue({ records, total: 7 });

    const page = await service.list(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, QUERY);

    expect(page.items.map((item) => item.id)).toEqual(['d-1', 'd-2']);
    expect(page.items[0]?.eventType).toBe(WebhookEventType.OrderCreated);
    expect(page.nextCursor).toBe('d-2');
    expect(page.total).toBe(7);
  });
});

describe('WebhookDeliveriesService.get', () => {
  it('answers 404 for a delivery the endpoint does not have', async () => {
    const { service } = createService();

    await expect(service.get(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, 'other')).rejects.toThrow(
      WEBHOOK_DELIVERY_NOT_FOUND,
    );
  });

  it('returns the delivery with the body it sends', async () => {
    const { service, deliveries } = createService();
    deliveries.findDetail.mockResolvedValue(deliveryDetailRow());

    const detail = await service.get(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, TEST_DELIVERY_ID);

    expect(detail.payload.id).toBe(TEST_EVENT_ID);
  });
});

describe('WebhookDeliveriesService.redeliver', () => {
  it('creates a new delivery of the same event and asks for a dispatch', async () => {
    const { service, deliveries, queue } = createService();
    deliveries.findDetail.mockResolvedValue(deliveryDetailRow());

    const view = await service.redeliver(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, TEST_DELIVERY_ID);

    expect(deliveries.findDetail).toHaveBeenCalledWith(
      TEST_WORKSPACE_ID,
      TEST_ENDPOINT_ID,
      TEST_DELIVERY_ID,
    );
    expect(deliveries.create).toHaveBeenCalledWith(
      { workspaceId: TEST_WORKSPACE_ID, endpointId: TEST_ENDPOINT_ID, eventId: TEST_EVENT_ID },
      expect.any(Date),
    );
    expect(queue.dispatchSoon).toHaveBeenCalledTimes(1);
    expect(view.id).toBe(NEW_DELIVERY_ID);
  });

  it('answers 404 and creates nothing for an unknown delivery', async () => {
    const { service, deliveries, queue } = createService();

    await expect(service.redeliver(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, 'other')).rejects.toThrow(
      NotFoundException,
    );
    expect(deliveries.create).not.toHaveBeenCalled();
    expect(queue.dispatchSoon).not.toHaveBeenCalled();
  });
});

describe('WebhookDeliveriesService.sendTest', () => {
  it('stores a test event for this endpoint only and asks for a dispatch', async () => {
    const { service, deliveries, queue } = createService();

    const view = await service.sendTest(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID);

    expect(deliveries.createWithEvent).toHaveBeenCalledWith(
      {
        workspaceId: TEST_WORKSPACE_ID,
        endpointId: TEST_ENDPOINT_ID,
        type: WebhookEventType.Test,
        data: { endpointId: TEST_ENDPOINT_ID, message: WEBHOOK_TEST_MESSAGE },
      },
      expect.any(Date),
    );
    expect(queue.dispatchSoon).toHaveBeenCalledTimes(1);
    expect(view.id).toBe(NEW_DELIVERY_ID);
  });

  it('answers 404 for an endpoint the workspace does not have', async () => {
    const { service, deliveries } = createService(false);

    await expect(service.sendTest(TEST_WORKSPACE_ID, 'other')).rejects.toThrow(NotFoundException);
    expect(deliveries.createWithEvent).not.toHaveBeenCalled();
  });
});
