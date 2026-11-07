import { createHmac, randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { ChannelType, type ExternalOrder } from '@crossmart/connectors';
import { OrderIngestionService } from '@crossmart/core/orders/services/order-ingestion.service.js';
import {
  StockAdjustmentMode,
  SyncJobQueue,
  WebhookDeliveryRunner,
  WebhookDispatcher,
  WebhookEventType,
  WebhookJobQueue,
} from '@crossmart/core';
import {
  InventoryMovementReason,
  PrismaService,
  WebhookAttemptOutcome,
  WebhookDeliveryStatus,
  WebhookDisabledReason,
  WorkspaceRole,
} from '@crossmart/database';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { RecordingWebhookJobQueue } from './support/recording-webhook-job.queue.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';
import { type ReceivedWebhook, WebhookReceiver } from './support/webhook-receiver.js';

const SIGNATURE_HEADER = 'crossmart-signature';
const SIGNATURE_TOLERANCE_SECONDS = 300;

/** Verifies a delivery as a receiver would: any v1 matching HMAC-SHA256 of `t.body`. */
function verifies(received: ReceivedWebhook, secret: string): boolean {
  const parts = String(received.headers[SIGNATURE_HEADER]).split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) ?? '';
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${received.body}`)
    .digest('hex');
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) <= SIGNATURE_TOLERANCE_SECONDS;
  return fresh && signatures.includes(expected);
}

function signatureCount(received: ReceivedWebhook): number {
  return String(received.headers[SIGNATURE_HEADER])
    .split(',')
    .filter((part) => part.startsWith('v1=')).length;
}

// Set before the app module reads them: a key to seal secrets with, and the settings of a
// self-hosted instance on a trusted network, so the local receiver may get webhooks.
vi.hoisted(() => {
  Object.assign(process.env, {
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
    WEBHOOK_ALLOW_PRIVATE_URLS: 'true',
  });
});

describe('Outgoing webhooks (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let queue: RecordingWebhookJobQueue;
  let receiver: WebhookReceiver;
  let owner: SignedUpUser;

  beforeAll(async () => {
    queue = new RecordingWebhookJobQueue();
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(SyncJobQueue)
        .useValue(new RecordingSyncJobQueue())
        .overrideProvider(WebhookJobQueue)
        .useValue(queue),
    );
    prisma = app.get(PrismaService);
    receiver = new WebhookReceiver();
    await receiver.start();
    owner = await signUp(app, 'Webhook Owner');
  });

  afterAll(async () => {
    await receiver.stop();
    await app.close();
  });

  const endpointsPath = (user: SignedUpUser): string =>
    `/api/v1/workspaces/${user.workspaceId}/webhook-endpoints`;

  /** Runs what the worker would: dispatch due deliveries, then send each one. */
  async function runWorker(): Promise<void> {
    await app.get(WebhookDispatcher).dispatch();
    for (const ref of queue.drain()) await app.get(WebhookDeliveryRunner).deliver(ref);
  }

  async function createEndpoint(eventTypes: WebhookEventType[]) {
    const created = await request(app.getHttpServer())
      .post(endpointsPath(owner))
      .set('Cookie', owner.cookie)
      .send({ url: receiver.url, eventTypes, description: 'e2e receiver' });
    expect(created.status).toBe(HttpStatus.CREATED);
    return created.body as { endpoint: { id: string }; secret: string };
  }

  function createProduct(title: string) {
    return request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', owner.cookie)
      .send({ title, variants: [{ sku: `${title}-SKU`, price: '10', quantity: 5 }] });
  }

  it('delivers a signed product.created event once its transaction commits', async () => {
    const { endpoint, secret } = await createEndpoint([WebhookEventType.ProductCreated]);
    expect(secret).toMatch(/^whsec_/);

    const product = await createProduct('Signed Mug');
    expect(product.status).toBe(HttpStatus.CREATED);
    receiver.received.length = 0;
    await runWorker();

    const [delivery] = receiver.received;
    expect(delivery).toBeDefined();
    expect(verifies(delivery!, secret)).toBe(true);
    const envelope = JSON.parse(delivery!.body);
    expect(envelope).toMatchObject({
      type: WebhookEventType.ProductCreated,
      workspaceId: owner.workspaceId,
      apiVersion: 'v1',
      data: { product: { id: product.body.id, title: 'Signed Mug' } },
    });
    expect(delivery!.headers['crossmart-event-id']).toBe(envelope.id);

    const log = await request(app.getHttpServer())
      .get(`${endpointsPath(owner)}/${endpoint.id}/deliveries`)
      .set('Cookie', owner.cookie);
    expect(log.body.items[0]).toMatchObject({
      eventId: envelope.id,
      status: WebhookDeliveryStatus.SUCCEEDED,
      attempts: 1,
      responseStatus: HttpStatus.OK,
    });
    await deleteEndpoint(endpoint.id);
  });

  it('never shows the secret again, and refuses unknown or test event subscriptions', async () => {
    const { endpoint } = await createEndpoint([WebhookEventType.OrderCreated]);
    const listed = await request(app.getHttpServer())
      .get(endpointsPath(owner))
      .set('Cookie', owner.cookie);
    expect(JSON.stringify(listed.body)).not.toContain('whsec_');
    expect(listed.body[0]).not.toHaveProperty('sealedSecret');
    expect(listed.body[0].lastDelivery).toBeNull();

    for (const eventTypes of [[WebhookEventType.Test], ['order.teleported'], []]) {
      const refused = await request(app.getHttpServer())
        .post(endpointsPath(owner))
        .set('Cookie', owner.cookie)
        .send({ url: receiver.url, eventTypes });
      expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
    }
    await deleteEndpoint(endpoint.id);
  });

  it('sends a test event and redelivers it with the same event id', async () => {
    const { endpoint, secret } = await createEndpoint([WebhookEventType.OrderCreated]);
    const base = `${endpointsPath(owner)}/${endpoint.id}`;

    const test = await request(app.getHttpServer())
      .post(`${base}/test`)
      .set('Cookie', owner.cookie);
    expect(test.status).toBe(HttpStatus.ACCEPTED);
    expect(queue.dispatchRequests).toBeGreaterThan(0);
    receiver.received.length = 0;
    await runWorker();
    const first = JSON.parse(receiver.received[0]!.body);
    expect(first.type).toBe(WebhookEventType.Test);
    expect(verifies(receiver.received[0]!, secret)).toBe(true);

    const again = await request(app.getHttpServer())
      .post(`${base}/deliveries/${test.body.id}/redeliver`)
      .set('Cookie', owner.cookie);
    expect(again.status).toBe(HttpStatus.ACCEPTED);
    expect(again.body.id).not.toBe(test.body.id);
    await runWorker();
    expect(JSON.parse(receiver.received[1]!.body).id).toBe(first.id);

    const detail = await request(app.getHttpServer())
      .get(`${base}/deliveries/${test.body.id}`)
      .set('Cookie', owner.cookie);
    expect(detail.body.payload).toEqual(first);
    await deleteEndpoint(endpoint.id);
  });

  it('schedules a retry when the endpoint fails, then signs with both secrets after a rotation', async () => {
    const { endpoint } = await createEndpoint([WebhookEventType.InventoryStockChanged]);
    const base = `${endpointsPath(owner)}/${endpoint.id}`;
    receiver.status = HttpStatus.INTERNAL_SERVER_ERROR;
    await request(app.getHttpServer()).post(`${base}/test`).set('Cookie', owner.cookie);
    await runWorker();
    receiver.status = HttpStatus.OK;

    const product = await createProduct('Retried Mug');
    const item = await prisma.inventoryItem.findFirstOrThrow({
      where: { workspaceId: owner.workspaceId, variant: { productId: product.body.id } },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/inventory-items/${item.id}/adjustments`)
      .set('Cookie', owner.cookie)
      .send({
        mode: StockAdjustmentMode.Delta,
        quantity: 3,
        reason: InventoryMovementReason.RECEIVED,
      });
    receiver.status = HttpStatus.SERVICE_UNAVAILABLE;
    await runWorker();
    receiver.status = HttpStatus.OK;

    const log = await request(app.getHttpServer())
      .get(`${base}/deliveries`)
      .query({ eventType: WebhookEventType.InventoryStockChanged })
      .set('Cookie', owner.cookie);
    expect(log.body.items[0]).toMatchObject({
      status: WebhookDeliveryStatus.RETRYING,
      attempts: 1,
      responseStatus: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'The endpoint answered with HTTP 503',
    });
    expect(new Date(log.body.items[0].nextAttemptAt).getTime()).toBeGreaterThan(Date.now());
    const failing = await request(app.getHttpServer()).get(base).set('Cookie', owner.cookie);
    expect(failing.body.consecutiveFailures).toBe(2);
    expect(failing.body.lastDelivery).toMatchObject({
      outcome: WebhookAttemptOutcome.FAILED,
      responseStatus: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'The endpoint answered with HTTP 503',
    });

    const rotated = await request(app.getHttpServer())
      .post(`${base}/rotate-secret`)
      .set('Cookie', owner.cookie);
    expect(rotated.status).toBe(HttpStatus.OK);
    receiver.received.length = 0;
    await request(app.getHttpServer()).post(`${base}/test`).set('Cookie', owner.cookie);
    await runWorker();
    expect(signatureCount(receiver.received[0]!)).toBe(2);
    expect(verifies(receiver.received[0]!, rotated.body.secret)).toBe(true);
    const listed = await request(app.getHttpServer())
      .get(endpointsPath(owner))
      .set('Cookie', owner.cookie);
    const healthy = listed.body.find(
      (listedEndpoint: { id: string }) => listedEndpoint.id === endpoint.id,
    );
    expect(healthy.consecutiveFailures).toBe(0);
    expect(healthy.lastDelivery).toMatchObject({
      outcome: WebhookAttemptOutcome.SUCCEEDED,
      responseStatus: HttpStatus.OK,
      error: null,
    });
    expect(new Date(healthy.lastDelivery.attemptedAt).getTime()).toBeGreaterThan(
      new Date(failing.body.lastDelivery.attemptedAt).getTime(),
    );
    await deleteEndpoint(endpoint.id);
  });

  it('records no event for an endpoint that is turned off, and fails what it had pending', async () => {
    const { endpoint } = await createEndpoint([WebhookEventType.ProductCreated]);
    const base = `${endpointsPath(owner)}/${endpoint.id}`;
    await createProduct('Pending Mug');

    const off = await request(app.getHttpServer())
      .patch(base)
      .set('Cookie', owner.cookie)
      .send({ enabled: false, description: 'paused' });
    expect(off.body).toMatchObject({
      enabled: false,
      disabledReason: WebhookDisabledReason.MANUAL,
      description: 'paused',
    });
    await createProduct('Unsent Mug');

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { endpointId: endpoint.id },
    });
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe(WebhookDeliveryStatus.FAILED);

    const on = await request(app.getHttpServer())
      .patch(base)
      .set('Cookie', owner.cookie)
      .send({ enabled: true });
    expect(on.body).toMatchObject({ enabled: true, disabledReason: null });
    await deleteEndpoint(endpoint.id);
  });

  it('is managed only by members who may manage webhooks, inside their workspace', async () => {
    const { endpoint } = await createEndpoint([WebhookEventType.OrderCreated]);
    const key = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'editor', role: WorkspaceRole.EDITOR });
    const asEditor = await request(app.getHttpServer())
      .get(endpointsPath(owner))
      .set(API_KEY_HEADER, key.body.secret);
    expect(asEditor.status).toBe(HttpStatus.FORBIDDEN);

    const stranger = await signUp(app, 'Stranger');
    const foreign = await request(app.getHttpServer())
      .get(`${endpointsPath(stranger)}/${endpoint.id}`)
      .set('Cookie', stranger.cookie);
    expect(foreign.status).toBe(HttpStatus.NOT_FOUND);

    await deleteEndpoint(endpoint.id);
    const gone = await request(app.getHttpServer())
      .get(`${endpointsPath(owner)}/${endpoint.id}`)
      .set('Cookie', owner.cookie);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('sends order.created once, and order.updated only for a newer copy of the order', async () => {
    const { endpoint } = await createEndpoint([
      WebhookEventType.OrderCreated,
      WebhookEventType.OrderUpdated,
    ]);
    const { id: connectionId } = await prisma.channelConnection.create({
      data: {
        workspaceId: owner.workspaceId,
        channel: ChannelType.Shopify,
        externalAccountId: `${randomUUID()}.myshopify.com`,
        displayName: 'Webhook store',
      },
    });
    const origin = {
      workspaceId: owner.workspaceId,
      connectionId,
      storeName: 'Webhook store',
      syncedFrom: new Date(0),
    };
    const placedAt = new Date();
    const order: ExternalOrder = {
      externalId: randomUUID(),
      name: '#1001',
      placedAt,
      updatedAt: placedAt,
      cancelled: false,
      currencyCode: 'USD',
      total: '20.00',
      lines: [
        {
          externalId: randomUUID(),
          externalVariantId: null,
          sku: 'NO-SUCH-SKU',
          title: 'Mug',
          quantity: 2,
          fulfilledQuantity: 0,
          unitPrice: '10.00',
        },
      ],
    };
    const orders = app.get(OrderIngestionService);
    await orders.ingest(origin, order);
    await orders.ingest(origin, order);
    await orders.ingest(origin, { ...order, total: '25.00', updatedAt: new Date(Date.now() + 1) });

    const events = await prisma.webhookEvent.findMany({
      where: { deliveries: { some: { endpointId: endpoint.id } } },
      orderBy: { createdAt: 'asc' },
    });
    expect(events.map((event) => event.type)).toEqual([
      WebhookEventType.OrderCreated,
      WebhookEventType.OrderUpdated,
    ]);
    expect(events[1]?.data).toMatchObject({
      order: { name: '#1001', total: '25.00', channel: ChannelType.Shopify, connectionId },
    });
    await deleteEndpoint(endpoint.id);
  });

  async function deleteEndpoint(endpointId: string): Promise<void> {
    const deleted = await request(app.getHttpServer())
      .delete(`${endpointsPath(owner)}/${endpointId}`)
      .set('Cookie', owner.cookie);
    expect(deleted.status).toBe(HttpStatus.NO_CONTENT);
  }
});
