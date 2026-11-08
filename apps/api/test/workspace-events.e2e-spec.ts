import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  ActivityAction,
  ActivitySubjectType,
  AgentWorkerActionStatus,
  AgentWorkerToolKind,
  WORKSPACE_EVENT_SETTLE_MS,
  WorkspaceEventCategory,
  WorkspaceEventSeverity,
  WorkspaceEventType,
  WorkspacePermission,
} from '@crossmart/core';
import {
  ActivityActorType,
  ActivityOutcome,
  OrderStatus,
  PrismaService,
  WebhookDeliveryStatus,
  WorkspaceRole,
} from '@crossmart/database';
import { createTestApp, type SignedUpUser, signUp } from './support/test-app.js';

interface EventBody {
  id: string;
  cursor: string;
  type: WorkspaceEventType;
  category: WorkspaceEventCategory;
  severity: WorkspaceEventSeverity;
  summary: string;
  detail: string | null;
  actor: { type: ActivityActorType; agentName: string | null };
  refs: Record<string, string | null>;
}

interface PageBody {
  items: EventBody[];
  cursor: string;
}

/** Past the settle time, so what was just written is readable. */
const SETTLED_DELAY_MS = WORKSPACE_EVENT_SETTLE_MS + 300;
const SSE_DATA_PREFIX = 'data: ';
const SSE_ID_PREFIX = 'id: ';
const READY_EVENT = 'event: ready';

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SETTLED_DELAY_MS));
}

describe('Workspace event stream (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let baseUrl: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    prisma = app.get(PrismaService);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  const eventsUrl = ({ workspaceId }: SignedUpUser) => `/api/v1/workspaces/${workspaceId}/events`;

  async function eventsOf(user: SignedUpUser, query: object = {}): Promise<PageBody> {
    const response = await request(app.getHttpServer())
      .get(eventsUrl(user))
      .query(query)
      .set('Cookie', user.cookie);
    expect(response.status).toBe(HttpStatus.OK);
    return response.body as PageBody;
  }

  /** A store with an order and a listing it refused, a failed webhook and an agent proposal. */
  async function seedWorkspace(user: SignedUpUser): Promise<{ connectionId: string }> {
    const { workspaceId } = user;
    const owner = await prisma.workspaceMember.findFirstOrThrow({ where: { workspaceId } });
    const connection = await prisma.channelConnection.create({
      data: {
        workspaceId,
        channel: 'shopify',
        externalAccountId: `${workspaceId}.myshopify.com`,
        displayName: 'Outlet',
      },
    });
    await prisma.activityEvent.create({
      data: {
        workspaceId,
        actorType: ActivityActorType.SYSTEM,
        action: ActivityAction.ListingSyncFailed,
        outcome: ActivityOutcome.FAILED,
        subjectType: ActivitySubjectType.Product,
        subjectLabel: 'Mug',
        failureReason: 'Item specific Brand is missing',
        connectionId: connection.id,
        summary: 'Could not sync “Mug” on Outlet',
      },
    });
    await prisma.order.create({
      data: {
        workspaceId,
        connectionId: connection.id,
        externalId: 'gid://shopify/Order/1',
        name: '#1001',
        status: OrderStatus.OPEN,
        currencyCode: 'USD',
        total: '39.00',
        placedAt: new Date(),
        externalUpdatedAt: new Date(),
      },
    });
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        workspaceId,
        url: 'https://hooks.example.com/in/token',
        eventTypes: [],
        sealedSecret: 'x',
      },
    });
    const event = await prisma.webhookEvent.create({
      data: {
        id: crypto.randomUUID(),
        workspaceId,
        type: 'order.created',
        apiVersion: '2026-11-01',
        data: {},
      },
    });
    await prisma.webhookDelivery.create({
      data: {
        id: crypto.randomUUID(),
        workspaceId,
        eventId: event.id,
        endpointId: endpoint.id,
        status: WebhookDeliveryStatus.FAILED,
        error: 'The endpoint answered with HTTP 500',
      },
    });
    const conversation = await prisma.agentWorkerConversation.create({
      data: { workspaceId, userId: owner.userId, title: 'Fix eBay' },
    });
    const turn = await prisma.agentWorkerTurn.create({
      data: { conversationId: conversation.id, trigger: 'message', status: 'awaiting_approval' },
    });
    const message = await prisma.agentWorkerMessage.create({
      data: {
        conversationId: conversation.id,
        turnId: turn.id,
        position: 1,
        role: 'assistant',
        text: '',
        content: [],
      },
    });
    await prisma.agentWorkerAction.create({
      data: {
        conversationId: conversation.id,
        messageId: message.id,
        toolUseId: 'toolu_1',
        toolName: 'retry_store_listing',
        kind: AgentWorkerToolKind.Write,
        status: AgentWorkerActionStatus.Proposed,
        input: { productId: crypto.randomUUID(), connectionId: connection.id },
        summary: 'Retry publishing: Mug on Outlet',
      },
    });
    return { connectionId: connection.id };
  }

  it('merges the activity log, orders, webhooks and Crossmart Agent, oldest first', async () => {
    const owner = await signUp(app, 'Owner');
    const { connectionId } = await seedWorkspace(owner);
    await settle();

    const { items, cursor } = await eventsOf(owner);

    const byType = new Map(items.map((item) => [item.type, item]));
    expect(byType.get(WorkspaceEventType.ListingFailed)).toMatchObject({
      category: WorkspaceEventCategory.Stores,
      severity: WorkspaceEventSeverity.Error,
      detail: 'Item specific Brand is missing',
      refs: { connectionId },
    });
    expect(byType.get(WorkspaceEventType.OrderReceived)).toMatchObject({
      summary: 'Received order #1001 on Outlet',
      refs: { connectionId },
    });
    expect(byType.get(WorkspaceEventType.WebhookDeliveryFailed)?.summary).toBe(
      'Could not deliver order.created to hooks.example.com',
    );
    expect(byType.get(WorkspaceEventType.AgentChangeProposed)).toMatchObject({
      summary: 'Proposed: Retry publishing: Mug on Outlet',
      actor: { type: ActivityActorType.AGENT, agentName: 'Crossmart Agent' },
      refs: { connectionId },
    });
    const times = items.map((item) => item.cursor);
    expect(times).toHaveLength(new Set(times).size);
    expect(cursor).toBe(items.at(-1)?.cursor);

    expect((await eventsOf(owner, { after: cursor })).items).toEqual([]);
  });

  it('follows the cursor to what happens next, and refuses one it did not give out', async () => {
    const owner = await signUp(app, 'Owner');
    const { cursor } = await eventsOf(owner);
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', owner.cookie)
      .send({ title: 'Linen Shirt', variants: [{ price: '10' }] });
    await settle();

    const next = await eventsOf(owner, { after: cursor });
    expect(next.items.map((item) => [item.type, item.summary])).toEqual([
      [WorkspaceEventType.WorkspaceChange, 'Created product “Linen Shirt”'],
    ]);

    const refused = await request(app.getHttpServer())
      .get(eventsUrl(owner))
      .query({ after: 'not-a-cursor' })
      .set('Cookie', owner.cookie);
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('shows each reader only the sources their role allows', async () => {
    const owner = await signUp(app, 'Owner');
    await seedWorkspace(owner);
    await settle();
    const key = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Reporting', role: WorkspaceRole.VIEWER });

    const page = await request(app.getHttpServer())
      .get(eventsUrl(owner))
      .set(API_KEY_HEADER, key.body.secret);

    const types = (page.body as PageBody).items.map((item) => item.type);
    expect(types).toContain(WorkspaceEventType.OrderReceived);
    expect(types).not.toContain(WorkspaceEventType.WebhookDeliveryFailed);
    expect(types).not.toContain(WorkspaceEventType.AgentChangeProposed);

    const role = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/roles`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Stock only', permissions: [WorkspacePermission.ViewInventory] });
    const stockKey = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Stock', role: WorkspaceRole.CUSTOM, customRoleId: role.body.id });
    const forbidden = await request(app.getHttpServer())
      .get(eventsUrl(owner))
      .set(API_KEY_HEADER, stockKey.body.secret);
    expect(forbidden.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('streams the backlog, says it is ready, and resumes after Last-Event-ID', async () => {
    const owner = await signUp(app, 'Owner');
    await seedWorkspace(owner);
    await settle();

    const first = await readUntilReady(owner);
    expect(first.events.map((event) => event.type)).toContain(WorkspaceEventType.OrderReceived);
    expect(first.ids.at(-1)).toBe(first.readyCursor);

    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', owner.cookie)
      .send({ title: 'Wool Socks', variants: [{ price: '8' }] });
    await settle();

    const resumed = await readUntilReady(owner, first.readyCursor);
    expect(resumed.events.map((event) => event.summary)).toEqual(['Created product “Wool Socks”']);

    const refused = await fetch(`${baseUrl}${eventsUrl(owner)}/stream`, {
      headers: { Cookie: owner.cookie, 'Last-Event-ID': 'nope' },
    });
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
  });

  /** Opens the stream, reads it until `ready`, then leaves. */
  async function readUntilReady(user: SignedUpUser, lastEventId?: string) {
    const controller = new AbortController();
    const response = await fetch(`${baseUrl}${eventsUrl(user)}/stream`, {
      headers: { Cookie: user.cookie, ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}) },
      signal: controller.signal,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const text = await readUntil(response, READY_EVENT);
    controller.abort();
    const blocks = text.split('\n\n').filter((block) => block.includes(SSE_DATA_PREFIX));
    const lines = (prefix: string) =>
      blocks.flatMap((block) => block.split('\n').filter((line) => line.startsWith(prefix)));
    const ids = lines(SSE_ID_PREFIX).map((line) => line.slice(SSE_ID_PREFIX.length));
    const ready = blocks.find((block) => block.includes(READY_EVENT)) ?? '';
    const readyCursor = ready.split('\n')[0]?.slice(SSE_ID_PREFIX.length) ?? '';
    const events = blocks
      .filter((block) => !block.includes(READY_EVENT))
      .flatMap((block) => lines(SSE_DATA_PREFIX).filter((line) => block.includes(line)))
      .map((line) => JSON.parse(line.slice(SSE_DATA_PREFIX.length)) as EventBody);
    return { events, ids, readyCursor };
  }

  async function readUntil(response: Response, marker: string): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (!text.includes(marker)) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    const end = text.indexOf('\n\n', text.indexOf(marker));
    return end === -1 ? text : text.slice(0, end + 2);
  }
});
