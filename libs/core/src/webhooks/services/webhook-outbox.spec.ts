import type { Prisma } from '@crossmart/database';
import type { WebhookEventData } from '../entities/webhook-event-data.js';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import { TEST_WORKSPACE_ID } from '../testing/webhook-fixtures.js';
import { WEBHOOK_API_VERSION } from '../webhooks.constants.js';
import { type WebhookEventDataBuilder, WebhookOutbox } from './webhook-outbox.js';

type Transaction = Prisma.TransactionClient;
type FindEndpoints = Transaction['webhookEndpoint']['findMany'];
type CreateEvents = Transaction['webhookEvent']['createMany'];
type CreateDeliveries = Transaction['webhookDelivery']['createMany'];

const MUG_DELETED: WebhookEventData = { product: { id: 'product-a', title: 'Mug' } };
const CUP_DELETED: WebhookEventData = { product: { id: 'product-b', title: 'Cup' } };

function fakeTransaction(endpointIds: string[]) {
  const findEndpoints = vi
    .fn<(args: Prisma.WebhookEndpointFindManyArgs) => Promise<{ id: string }[]>>()
    .mockResolvedValue(endpointIds.map((id) => ({ id })));
  const createEvents = vi
    .fn<(args: { data: Prisma.WebhookEventCreateManyInput[] }) => Promise<{ count: number }>>()
    .mockResolvedValue({ count: 0 });
  const createDeliveries = vi
    .fn<(args: { data: Prisma.WebhookDeliveryCreateManyInput[] }) => Promise<{ count: number }>>()
    .mockResolvedValue({ count: 0 });
  const tx = {
    webhookEndpoint: { findMany: findEndpoints as unknown as FindEndpoints },
    webhookEvent: { createMany: createEvents as unknown as CreateEvents },
    webhookDelivery: { createMany: createDeliveries as unknown as CreateDeliveries },
  };
  return { tx: tx as unknown as Transaction, findEndpoints, createEvents, createDeliveries };
}

function builderOf(entries: WebhookEventData[]) {
  return vi.fn<WebhookEventDataBuilder>().mockResolvedValue(entries);
}

describe('WebhookOutbox.publish', () => {
  const outbox = new WebhookOutbox();
  const type = WebhookEventType.ProductDeleted;

  it('records nothing and never builds the data when no endpoint subscribes', async () => {
    const { tx, createEvents, createDeliveries } = fakeTransaction([]);
    const build = builderOf([MUG_DELETED]);

    expect(await outbox.publish(tx, TEST_WORKSPACE_ID, type, build)).toBe(0);
    expect(build).not.toHaveBeenCalled();
    expect(createEvents).not.toHaveBeenCalled();
    expect(createDeliveries).not.toHaveBeenCalled();
  });

  it('looks only for enabled endpoints of the workspace that subscribe to the type', async () => {
    const { tx, findEndpoints } = fakeTransaction([]);

    await outbox.publish(tx, TEST_WORKSPACE_ID, type, builderOf([MUG_DELETED]));

    expect(findEndpoints.mock.calls[0]?.[0].where).toEqual({
      workspaceId: TEST_WORKSPACE_ID,
      disabledReason: null,
      eventTypes: { has: type },
    });
  });

  it('writes one event per data entry and one delivery per event and endpoint', async () => {
    const { tx, createEvents, createDeliveries } = fakeTransaction(['endpoint-1', 'endpoint-2']);

    const count = await outbox.publish(
      tx,
      TEST_WORKSPACE_ID,
      type,
      builderOf([MUG_DELETED, CUP_DELETED]),
    );

    const events = createEvents.mock.calls[0]?.[0].data ?? [];
    const deliveries = createDeliveries.mock.calls[0]?.[0].data ?? [];
    expect(count).toBe(2);
    expect(events.map((event) => event.data)).toEqual([MUG_DELETED, CUP_DELETED]);
    expect(events.every((event) => event.apiVersion === WEBHOOK_API_VERSION)).toBe(true);
    expect(events.every((event) => event.type === type)).toBe(true);
    expect(deliveries).toHaveLength(4);
    const pairs = deliveries.map((delivery) => `${delivery.eventId}/${delivery.endpointId}`);
    expect(new Set(pairs).size).toBe(4);
    expect(deliveries.every((delivery) => delivery.nextAttemptAt instanceof Date)).toBe(true);
    expect(deliveries.every((delivery) => delivery.workspaceId === TEST_WORKSPACE_ID)).toBe(true);
  });

  it('writes nothing when the builder returns no entries', async () => {
    const { tx, createEvents, createDeliveries } = fakeTransaction(['endpoint-1']);

    expect(await outbox.publish(tx, TEST_WORKSPACE_ID, type, builderOf([]))).toBe(0);
    expect(createEvents).not.toHaveBeenCalled();
    expect(createDeliveries).not.toHaveBeenCalled();
  });
});
