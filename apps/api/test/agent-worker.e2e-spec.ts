import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  AGENT_WORKER_NAME,
  AGENT_WORKER_TOKEN_HEADER,
  AgentWorkerActionStatus,
  AgentWorkerEventType,
  AgentWorkerTurnStatus,
  AiProvider,
  AskChannel,
  type AiContentBlock,
  AiContentBlockType,
  EntitlementEnforcement,
  EntitlementErrorCode,
  Feature,
  MANUAL_MOVEMENT_REASONS,
  StockAdjustmentMode,
} from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { PrismaService, ProductStatus, WorkspaceRole } from '@crossmart/database';
import { CITED_ANSWER } from './support/ask.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

interface StreamEvent {
  type: AgentWorkerEventType;
  turn?: { status: AgentWorkerTurnStatus };
  action?: { id: string; status: AgentWorkerActionStatus; toolName: string; risks: string[] };
  error?: { code: string };
}

const SSE_EVENT_SEPARATOR = '\n\n';
const SSE_DATA_PREFIX = 'data: ';

/** The JSON of every `data:` line of an event stream, in order. */
function parseEvents(body: string): StreamEvent[] {
  return body
    .split(SSE_EVENT_SEPARATOR)
    .flatMap((chunk) => chunk.split('\n').filter((line) => line.startsWith(SSE_DATA_PREFIX)))
    .map((line) => JSON.parse(line.slice(SSE_DATA_PREFIX.length)) as StreamEvent);
}

function firstOf(events: StreamEvent[], type: AgentWorkerEventType): StreamEvent {
  const found = events.find((event) => event.type === type);
  if (!found) throw new Error(`No ${type} event`);
  return found;
}

function toolUse(name: string, input: Record<string, unknown>): AiContentBlock {
  return { type: AiContentBlockType.ToolUse, id: `toolu_${randomUUID()}`, name, input };
}

function text(value: string): AiContentBlock {
  return { type: AiContentBlockType.Text, text: value };
}

describe('Agent Worker (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const ai = new FakeAiProvider();
  const enforcement = { enforced: false };

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(AiProvider)
        .useValue(ai)
        .overrideProvider(EntitlementEnforcement)
        .useValue(enforcement),
    );
    // Agent Worker calls the API over the loopback interface, so the test server must listen.
    await app.listen(0);
    prisma = app.get(PrismaService);
  });

  afterEach(() => {
    enforcement.enforced = false;
    ai.clearReplies();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const conversationsOf = (user: SignedUpUser) =>
    `/api/v1/workspaces/${user.workspaceId}/agent-worker/conversations`;

  async function startConversation(user: SignedUpUser): Promise<string> {
    const response = await request(server())
      .post(conversationsOf(user))
      .set('Cookie', user.cookie)
      .send({});
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body.id;
  }

  async function send(user: SignedUpUser, conversationId: string, message: string) {
    return request(server())
      .post(`${conversationsOf(user)}/${conversationId}/messages`)
      .set('Cookie', user.cookie)
      .send({ text: message });
  }

  async function decide(user: SignedUpUser, conversationId: string, approvedActionIds: string[]) {
    return request(server())
      .post(`${conversationsOf(user)}/${conversationId}/decision`)
      .set('Cookie', user.cookie)
      .send({ approvedActionIds });
  }

  async function createStockedProduct(user: SignedUpUser): Promise<string> {
    const sku = `MUG-${randomUUID()}`;
    const created = await request(server())
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: 'Stoneware Mug',
        status: ProductStatus.ACTIVE,
        variants: [{ sku, price: '20.00', quantity: 3 }],
      });
    expect(created.status).toBe(HttpStatus.CREATED);
    const inventory = await request(server())
      .get(`/api/v1/workspaces/${user.workspaceId}/inventory-items`)
      .query({ search: sku })
      .set('Cookie', user.cookie);
    return inventory.body.items[0].inventoryItemId;
  }

  async function onHand(user: SignedUpUser, inventoryItemId: string): Promise<number> {
    const inventory = await request(server())
      .get(`/api/v1/workspaces/${user.workspaceId}/inventory-items`)
      .set('Cookie', user.cookie);
    return inventory.body.items.find(
      (item: { inventoryItemId: string }) => item.inventoryItemId === inventoryItemId,
    ).onHand;
  }

  /** Scripts a read then a stock adjustment, sends the message, and checks the proposal. */
  async function proposeStockAdjustment(owner: SignedUpUser, inventoryItemId: string) {
    const conversationId = await startConversation(owner);
    const adjustment = {
      inventoryItemId,
      mode: StockAdjustmentMode.Delta,
      quantity: 5,
      reason: MANUAL_MOVEMENT_REASONS[0],
    };
    ai.replyWith([toolUse('list_inventory', { search: 'Stoneware' })])
      .replyWith([text('I will add 5 mugs.'), toolUse('adjust_stock', adjustment)])
      .replyWith([text('Done: 8 mugs on hand.')]);
    const proposed = await send(owner, conversationId, 'Add 5 mugs to stock');
    expect(proposed.status).toBe(HttpStatus.OK);
    expect(proposed.headers['content-type']).toContain('text/event-stream');
    return { conversationId, events: parseEvents(proposed.text) };
  }

  it('reads at once and proposes a change without making it', async () => {
    const owner = await signUp(app, 'Careful Keeper');
    const inventoryItemId = await createStockedProduct(owner);

    const { events } = await proposeStockAdjustment(owner, inventoryItemId);

    expect(events[0]?.type).toBe(AgentWorkerEventType.TurnStarted);
    const read = firstOf(events, AgentWorkerEventType.ToolFinished);
    expect(read.action?.status).toBe(AgentWorkerActionStatus.Succeeded);
    expect(firstOf(events, AgentWorkerEventType.ActionProposed).action).toMatchObject({
      status: AgentWorkerActionStatus.Proposed,
      toolName: 'adjust_stock',
    });
    expect(events.at(-1)?.turn?.status).toBe(AgentWorkerTurnStatus.AwaitingApproval);
    expect(await onHand(owner, inventoryItemId)).toBe(3);
    expect(JSON.stringify(ai.conversationRequests[1]?.messages)).toContain(inventoryItemId);
  });

  it('makes an approved change through the API and credits Agent Worker for the person', async () => {
    const owner = await signUp(app, 'Stock Keeper');
    const inventoryItemId = await createStockedProduct(owner);
    const { conversationId, events } = await proposeStockAdjustment(owner, inventoryItemId);
    const actionId = firstOf(events, AgentWorkerEventType.ActionProposed).action?.id ?? '';

    const decided = parseEvents((await decide(owner, conversationId, [actionId])).text);

    expect(firstOf(decided, AgentWorkerEventType.ActionDecided).action?.status).toBe(
      AgentWorkerActionStatus.Executed,
    );
    expect(decided.at(-1)?.turn?.status).toBe(AgentWorkerTurnStatus.Completed);
    expect(await onHand(owner, inventoryItemId)).toBe(8);
    const activity = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/activity`)
      .set('Cookie', owner.cookie);
    expect(activity.body.items[0].actor).toMatchObject({
      agentName: AGENT_WORKER_NAME,
      name: 'Stock Keeper',
    });
    const detail = await request(server())
      .get(`${conversationsOf(owner)}/${conversationId}`)
      .set('Cookie', owner.cookie);
    expect(detail.body.conversation.title).toBe('Add 5 mugs to stock');
    expect(detail.body.messages).toHaveLength(4);
    expect(detail.body.activeTurn).toBeNull();
  });

  it('rewrites a product title through the shared replace_product tool once confirmed', async () => {
    const owner = await signUp(app, 'Title Writer');
    await createStockedProduct(owner);
    const products = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', owner.cookie);
    const product = (
      await request(server())
        .get(`/api/v1/workspaces/${owner.workspaceId}/products/${products.body.items[0].id}`)
        .set('Cookie', owner.cookie)
    ).body;
    const conversationId = await startConversation(owner);
    const variants = product.variants.map(
      (variant: { id: string; sku: string; price: string }) => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
      }),
    );
    ai.replyWith([
      toolUse('replace_product', {
        productId: product.id,
        handle: product.handle,
        title: 'Stoneware Mug – Handmade, 350 ml',
        status: product.status,
        variants,
      }),
    ]).replyWith([text('Renamed.')]);

    const events = parseEvents((await send(owner, conversationId, 'Sharpen the title')).text);
    const action = firstOf(events, AgentWorkerEventType.ActionProposed).action;
    expect(action?.risks).toEqual(['destructive']);
    const decided = await request(server())
      .post(`${conversationsOf(owner)}/${conversationId}/decision`)
      .set('Cookie', owner.cookie)
      .send({ approvedActionIds: [action?.id], confirmHighRisk: true });

    expect(
      firstOf(parseEvents(decided.text), AgentWorkerEventType.ActionDecided).action?.status,
    ).toBe(AgentWorkerActionStatus.Executed);
    const renamed = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products/${product.id}`)
      .set('Cookie', owner.cookie);
    expect(renamed.body.title).toBe('Stoneware Mug – Handmade, 350 ml');
  });

  it('edits only a title through update_product_text, with no confirmation needed', async () => {
    const owner = await signUp(app, 'Copy Editor');
    const inventoryItemId = await createStockedProduct(owner);
    const item = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/inventory-items/${inventoryItemId}`)
      .set('Cookie', owner.cookie);
    expect(item.body).toMatchObject({ productTitle: 'Stoneware Mug', onHand: 3 });
    const productId = item.body.productId;
    const conversationId = await startConversation(owner);
    ai.replyWith([
      toolUse('update_product_text', { productId, title: 'Stoneware Mug – 350 ml' }),
    ]).replyWith([text('Renamed.')]);

    const events = parseEvents((await send(owner, conversationId, 'Sharpen the title')).text);
    const action = firstOf(events, AgentWorkerEventType.ActionProposed).action;
    expect(action).toMatchObject({
      risks: [],
      preview: {
        target: 'Stoneware Mug',
        headline: 'Edit the title in the catalog',
        changes: [{ label: 'Title', before: 'Stoneware Mug', after: 'Stoneware Mug – 350 ml' }],
      },
    });
    await decide(owner, conversationId, [action?.id ?? '']);

    const product = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products/${productId}`)
      .set('Cookie', owner.cookie);
    expect(product.body.title).toBe('Stoneware Mug – 350 ml');
    expect(product.body.variants[0]).toMatchObject({ price: '20.00', available: 3 });
  });

  it('changes one variant’s price through update_variant_price once the price change is confirmed', async () => {
    const owner = await signUp(app, 'Price Setter');
    const inventoryItemId = await createStockedProduct(owner);
    const item = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/inventory-items/${inventoryItemId}`)
      .set('Cookie', owner.cookie);
    const { productId, variantId } = item.body;
    const conversationId = await startConversation(owner);
    ai.replyWith([
      toolUse('update_variant_price', {
        productId,
        variantId,
        price: '17.50',
        compareAtPrice: '20.00',
      }),
    ]).replyWith([text('Repriced.')]);

    const events = parseEvents((await send(owner, conversationId, 'Put the mug on sale')).text);
    const action = firstOf(events, AgentWorkerEventType.ActionProposed).action;
    expect(action).toMatchObject({
      risks: ['price_change'],
      preview: {
        headline: expect.stringMatching(/^Change the catalog price of MUG-/),
        changes: [
          { label: expect.stringMatching(/^Price \(MUG-/), before: '$20.00', after: '$17.50' },
          { label: expect.stringMatching(/^Compare-at price/), before: 'none', after: '$20.00' },
        ],
      },
    });
    expect((await decide(owner, conversationId, [action?.id ?? ''])).status).toBe(
      HttpStatus.BAD_REQUEST,
    );
    await request(server())
      .post(`${conversationsOf(owner)}/${conversationId}/decision`)
      .set('Cookie', owner.cookie)
      .send({ approvedActionIds: [action?.id], confirmHighRisk: true });

    const product = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products/${productId}`)
      .set('Cookie', owner.cookie);
    expect(product.body.title).toBe('Stoneware Mug');
    expect(product.body.variants[0]).toMatchObject({
      price: '17.50',
      compareAtPrice: '20.00',
      available: 3,
    });
  });

  it('refuses an invalid, empty or foreign variant price edit', async () => {
    const owner = await signUp(app, 'Variant Owner');
    const stranger = await signUp(app, 'Variant Stranger');
    const item = await request(server())
      .get(
        `/api/v1/workspaces/${owner.workspaceId}/inventory-items/${await createStockedProduct(owner)}`,
      )
      .set('Cookie', owner.cookie);
    const path = (user: SignedUpUser, variantId = item.body.variantId) =>
      `/api/v1/workspaces/${user.workspaceId}/products/${item.body.productId}/variants/${variantId}`;
    const patch = (user: SignedUpUser, body: object, variantId?: string) =>
      request(server()).patch(path(user, variantId)).set('Cookie', user.cookie).send(body);

    expect((await patch(owner, { price: '-3' })).status).toBe(HttpStatus.BAD_REQUEST);
    expect((await patch(owner, {})).status).toBe(HttpStatus.BAD_REQUEST);
    expect((await patch(owner, { price: '5' }, randomUUID())).status).toBe(HttpStatus.NOT_FOUND);
    expect((await patch(stranger, { price: '5' })).status).toBe(HttpStatus.NOT_FOUND);
    const cleared = await patch(owner, { price: '9.5', compareAtPrice: null });
    expect(cleared.body.variants[0]).toMatchObject({ price: '9.50', compareAtPrice: null });
  });

  it('refuses an empty or foreign partial product edit', async () => {
    const owner = await signUp(app, 'Patch Owner');
    const stranger = await signUp(app, 'Patch Stranger');
    const inventoryItemId = await createStockedProduct(owner);
    const item = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/inventory-items/${inventoryItemId}`)
      .set('Cookie', owner.cookie);
    const path = (user: SignedUpUser) =>
      `/api/v1/workspaces/${user.workspaceId}/products/${item.body.productId}`;

    const empty = await request(server()).patch(path(owner)).set('Cookie', owner.cookie).send({});
    expect(empty.status).toBe(HttpStatus.BAD_REQUEST);
    const foreign = await request(server())
      .patch(path(stranger))
      .set('Cookie', stranger.cookie)
      .send({ title: 'Mine now' });
    expect(foreign.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('asks Crossmart questions as a read, on the Agent Worker channel', async () => {
    const owner = await signUp(app, 'Curious');
    const conversationId = await startConversation(owner);
    ai.answerWith(CITED_ANSWER);
    ai.replyWith([
      toolUse('ask_crossmart', { question: 'What are the API rate limits?' }),
    ]).replyWith([text('Past a limit the API answers 429.')]);

    const events = parseEvents((await send(owner, conversationId, 'Any API limits?')).text);

    expect(firstOf(events, AgentWorkerEventType.ToolFinished).action?.status).toBe(
      AgentWorkerActionStatus.Succeeded,
    );
    const asked = await prisma.askConversation.findFirst({
      where: {
        userId: (
          await prisma.user.findFirstOrThrow({
            where: { name: 'Curious' },
            orderBy: { createdAt: 'desc' },
          })
        ).id,
      },
    });
    expect(asked).toMatchObject({ channel: AskChannel.AgentWorker });
  });

  it('keeps conversations to their owner and refuses API keys', async () => {
    const owner = await signUp(app, 'Private Owner');
    const stranger = await signUp(app, 'Stranger');
    const conversationId = await startConversation(owner);

    const peek = await request(server())
      .get(`${conversationsOf(stranger)}/${conversationId}`)
      .set('Cookie', stranger.cookie);
    expect(peek.status).toBe(HttpStatus.NOT_FOUND);
    const intrude = await request(server())
      .get(`${conversationsOf(owner)}/${conversationId}`)
      .set('Cookie', stranger.cookie);
    expect(intrude.status).toBe(HttpStatus.NOT_FOUND);

    const key = await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Script', role: WorkspaceRole.EDITOR });
    const byKey = await request(server())
      .get(conversationsOf(owner))
      .set(API_KEY_HEADER, key.body.secret);
    expect(byKey.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('refuses a forged Agent Worker credential', async () => {
    const owner = await signUp(app, 'Forgery Target');
    const forged = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set(AGENT_WORKER_TOKEN_HEADER, 'eyJhbGciOiJIUzI1NiJ9.e30.forged');
    expect(forged.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('answers 409 to a decision when nothing waits, and keeps the turn going after rejecting', async () => {
    const owner = await signUp(app, 'Decider');
    const conversationId = await startConversation(owner);
    expect((await decide(owner, conversationId, [])).status).toBe(HttpStatus.CONFLICT);

    ai.replyWith([
      toolUse('remove_product_from_store', { productId: randomUUID(), connectionId: randomUUID() }),
    ]);
    const proposed = parseEvents((await send(owner, conversationId, 'Remove it')).text);
    const action = proposed.find(
      (event) => event.type === AgentWorkerEventType.ActionProposed,
    )?.action;
    expect(action?.risks).toEqual(['destructive']);

    const unconfirmed = await decide(owner, conversationId, [action?.id ?? '']);
    expect(unconfirmed.status).toBe(HttpStatus.BAD_REQUEST);

    const rejected = parseEvents((await decide(owner, conversationId, [])).text);
    expect(firstOf(rejected, AgentWorkerEventType.ActionDecided)?.action?.status).toBe(
      AgentWorkerActionStatus.Rejected,
    );
  });

  it('answers 402 before streaming once the plan’s AI credits are used up', async () => {
    const owner = await signUp(app, 'No Credits');
    const conversationId = await startConversation(owner);
    const me = await request(server()).get('/api/v1/me').set('Cookie', owner.cookie);
    const organizationId = me.body.workspaces[0].organizationId;
    const unlimited = [
      Feature.ActiveListings,
      Feature.ChannelConnections,
      Feature.Workspaces,
      Feature.Members,
      Feature.ApiKeys,
    ].map((feature) => ({ feature, limit: null }));
    const plan = await prisma.plan.create({
      data: {
        code: `e2e-${randomUUID()}`,
        name: 'No AI',
        active: false,
        sortOrder: 1_000,
        versions: {
          create: {
            version: 1,
            features: { create: [...unlimited, { feature: Feature.AiCredits, limit: 0 }] },
          },
        },
      },
      include: { versions: true },
    });
    await prisma.organizationSubscription.update({
      where: { organizationId },
      data: { planVersionId: plan.versions[0].id },
    });
    enforcement.enforced = true;

    const refused = await send(owner, conversationId, 'Hello');

    expect(refused.status).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(refused.body).toMatchObject({
      code: EntitlementErrorCode.PlanLimitReached,
      feature: Feature.AiCredits,
    });
    expect(ai.conversationRequests).toHaveLength(0);
  });

  it('lists and deletes the person’s conversations', async () => {
    const owner = await signUp(app, 'Tidy');
    const conversationId = await startConversation(owner);
    const list = await request(server()).get(conversationsOf(owner)).set('Cookie', owner.cookie);
    expect(list.body).toMatchObject({
      total: 1,
      items: [{ id: conversationId, pendingActionCount: 0 }],
    });

    const removed = await request(server())
      .delete(`${conversationsOf(owner)}/${conversationId}`)
      .set('Cookie', owner.cookie);
    expect(removed.status).toBe(HttpStatus.NO_CONTENT);
    const cancel = await request(server())
      .post(`${conversationsOf(owner)}/${conversationId}/cancel`)
      .set('Cookie', owner.cookie);
    expect(cancel.status).toBe(HttpStatus.NOT_FOUND);
  });
});
