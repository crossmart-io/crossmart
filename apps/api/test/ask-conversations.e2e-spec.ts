import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  AccountLookupKind,
  AiProvider,
  AskAnswerCache,
  AskCallerType,
  AskChannel,
  AskDailyBudget,
  AskOutcome,
  AskQuota,
  ASK_ACCOUNT_QUESTIONS_PER_DAY,
  ASK_ACCOUNT_QUOTA_KEY_PREFIX,
  ASK_CONVERSATION_IDLE_MS,
} from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import {
  InMemoryAskAnswerCache,
  InMemoryAskDailyBudget,
  InMemoryAskQuota,
} from '@crossmart/core/ask/testing/ask.fakes.js';
import { PrismaService, WorkspaceRole } from '@crossmart/database';
import { connectAgent, registerAgent } from './support/agent-oauth.js';
import { CITED_ANSWER, CLIENT_IP_HEADER, randomIp, USER_AGENT } from './support/ask.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

const ASK_PATH = '/api/v1/ask';
const BROWSER = 'Mozilla/5.0 (test)';

describe('Ask Crossmart conversations (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const ai = new FakeAiProvider();
  const budget = new InMemoryAskDailyBudget();
  const quota = new InMemoryAskQuota();

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(AiProvider)
        .useValue(ai)
        .overrideProvider(AskAnswerCache)
        .useValue(new InMemoryAskAnswerCache())
        .overrideProvider(AskDailyBudget)
        .useValue(budget)
        .overrideProvider(AskQuota)
        .useValue(quota),
    );
    prisma = app.get(PrismaService);
  });

  beforeEach(() => {
    ai.clearAnswers().answerWith(CITED_ANSWER);
  });

  afterAll(async () => {
    await app.close();
  });

  const ask = (body: Record<string, unknown>, ip: string, agent = BROWSER) =>
    request(app.getHttpServer())
      .post(ASK_PATH)
      .set(CLIENT_IP_HEADER, ip)
      .set(USER_AGENT, agent)
      .send(body);

  async function apiKeyOf(owner: SignedUpUser, role = WorkspaceRole.VIEWER): Promise<string> {
    const key = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Agent', role });
    return key.body.secret as string;
  }

  async function createProduct(owner: SignedUpUser, title: string, sku: string): Promise<void> {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', owner.cookie)
      .send({ title, variants: [{ price: '9.00', sku }] });
    expect(created.status).toBe(HttpStatus.CREATED);
  }

  describe('follow-up questions', () => {
    it('returns a conversation id and sends the earlier turns with a follow-up', async () => {
      const ip = randomIp();
      const first = await ask({ question: `What are the API rate limits? ${randomUUID()}` }, ip);
      expect(first.status).toBe(HttpStatus.OK);
      expect(first.body.conversationId).toMatch(/^conv_[A-Za-z0-9_-]{40,}$/);

      const followUp = await ask(
        { question: 'And for content drafts?', conversationId: first.body.conversationId },
        ip,
      );

      expect(followUp.status).toBe(HttpStatus.OK);
      expect(followUp.body.conversationId).toBe(first.body.conversationId);
      const prompt = ai.requests.at(-1)?.prompt ?? '';
      expect(prompt).toContain('<conversation>');
      expect(prompt).toContain('What are the API rate limits?');
      const stored = await prisma.askConversation.findUniqueOrThrow({
        where: { publicId: first.body.conversationId },
        include: { turns: true },
      });
      expect(stored.turnCount).toBe(2);
      expect(stored.turns.map((turn) => turn.position).sort()).toEqual([1, 2]);
    });

    it('lets only the same caller continue a conversation', async () => {
      const ip = randomIp();
      const first = await ask({ question: `rate limits ${randomUUID()}` }, ip);
      const { conversationId } = first.body;

      const otherAddress = await ask({ question: 'and keys?', conversationId }, randomIp());
      const otherBrowser = await ask({ question: 'and keys?', conversationId }, ip, 'curl/8');
      const otherKey = await apiKeyOf(await signUp(app, 'Other Caller'));
      const withKey = await request(app.getHttpServer())
        .post(ASK_PATH)
        .set(CLIENT_IP_HEADER, ip)
        .set(USER_AGENT, BROWSER)
        .set(API_KEY_HEADER, otherKey)
        .send({ question: 'and keys?', conversationId });

      expect(otherAddress.status).toBe(HttpStatus.NOT_FOUND);
      expect(otherBrowser.status).toBe(HttpStatus.NOT_FOUND);
      expect(withKey.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('expires a conversation after a day without a question', async () => {
      const ip = randomIp();
      const first = await ask({ question: `rate limits ${randomUUID()}` }, ip);
      await prisma.askConversation.update({
        where: { publicId: first.body.conversationId },
        data: { lastActivityAt: new Date(Date.now() - ASK_CONVERSATION_IDLE_MS - 1000) },
      });

      const late = await ask(
        { question: 'and keys?', conversationId: first.body.conversationId },
        ip,
      );

      expect(late.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('counts follow-ups against the daily cap, and caches only first anonymous questions', async () => {
      const ip = randomIp();
      const question = `What are the API rate limits? ${randomUUID()}`;
      const calls = ai.requests.length;
      const taken = budget.taken;

      const first = await ask({ question }, ip);
      await ask({ question }, randomIp());
      await ask({ question, conversationId: first.body.conversationId }, ip);

      expect(ai.requests.length - calls).toBe(2);
      expect(budget.taken - taken).toBe(2);
    });
  });

  describe('what is stored', () => {
    it('stores the turn with its channel and caller, secrets redacted and no address', async () => {
      const ip = randomIp();
      const secret = `cm_${randomUUID().replaceAll('-', '')}`;

      const reply = await ask(
        { question: `Why is ${secret} refused? ${randomUUID()}`, channel: AskChannel.WebWidget },
        ip,
      );

      const stored = await prisma.askConversation.findUniqueOrThrow({
        where: { publicId: reply.body.conversationId },
        include: { turns: true },
      });
      expect(stored).toMatchObject({
        channel: AskChannel.WebWidget,
        callerType: AskCallerType.Anonymous,
        workspaceId: null,
      });
      expect(stored.clientFingerprint).toMatch(/^[0-9a-f]{64}$/);
      expect(stored.turns[0]).toMatchObject({ outcome: AskOutcome.Answered, model: 'fake-model' });
      expect(stored.turns[0].question).toContain('[redacted]');
      expect(JSON.stringify(stored)).not.toContain(secret);
      expect(JSON.stringify(stored)).not.toContain(ip);
      expect(JSON.stringify(stored)).not.toContain(BROWSER);
    });
  });

  describe('account questions', () => {
    const lookUp = (query: string) =>
      ai
        .clearAnswers()
        .answerWith({
          ...CITED_ANSWER,
          outcome: AskOutcome.Unknown,
          sourceIds: [],
          lookups: [{ kind: AccountLookupKind.ListingStatus, query }],
        })
        .answerWith({ ...CITED_ANSWER, answer: 'It is not on a store yet.', sourceIds: ['A1'] });

    it('looks up the caller’s own workspace only, never another tenant’s', async () => {
      const mine = await signUp(app, 'Mug Seller');
      const theirs = await signUp(app, 'Other Seller');
      const sku = `SKU-${randomUUID().slice(0, 8)}`;
      const theirTitle = `Secret Teapot ${randomUUID().slice(0, 8)}`;
      await createProduct(theirs, theirTitle, sku);
      await createProduct(mine, 'My Mug', `MINE-${sku}`);
      const key = await apiKeyOf(mine);
      ai.requests.length = 0;
      lookUp(sku);

      const reply = await request(app.getHttpServer())
        .post(ASK_PATH)
        .set(CLIENT_IP_HEADER, randomIp())
        .set(API_KEY_HEADER, key)
        .send({ question: `Why is ${sku} not listed?` });

      expect(reply.status).toBe(HttpStatus.OK);
      const prompts = ai.requests.map((sent) => sent.prompt).join('\n');
      expect(prompts).toContain('My Mug');
      expect(prompts).not.toContain(theirTitle);
      const stored = await prisma.askConversation.findUniqueOrThrow({
        where: { publicId: reply.body.conversationId },
        include: { turns: true },
      });
      expect(stored).toMatchObject({
        callerType: AskCallerType.ApiKey,
        workspaceId: mine.workspaceId,
      });
      expect(stored.turns[0].accountLookups).toEqual([AccountLookupKind.ListingStatus]);
    });

    it('answers a signed-in person about a workspace they belong to, and 404s another', async () => {
      const owner = await signUp(app, 'Widget User');
      const stranger = await signUp(app, 'Stranger');
      lookUp('anything');

      const own = await request(app.getHttpServer())
        .post(ASK_PATH)
        .set(CLIENT_IP_HEADER, randomIp())
        .set('Cookie', owner.cookie)
        .send({
          question: 'Which listings failed?',
          workspaceId: owner.workspaceId,
          channel: AskChannel.AppWidget,
        });
      const other = await request(app.getHttpServer())
        .post(ASK_PATH)
        .set(CLIENT_IP_HEADER, randomIp())
        .set('Cookie', owner.cookie)
        .send({ question: 'Which listings failed?', workspaceId: stranger.workspaceId });

      expect(own.status).toBe(HttpStatus.OK);
      expect(other.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('gives an agent without catalog access no lookups at all', async () => {
      const owner = await signUp(app, 'Orders Agent Owner');
      const tokens = await connectAgent(app, owner, {
        clientId: await registerAgent(app, 'Orders Agent'),
        scope: 'orders:read',
      });
      ai.requests.length = 0;

      const reply = await request(app.getHttpServer())
        .post(ASK_PATH)
        .set(CLIENT_IP_HEADER, randomIp())
        .set({ Authorization: `Bearer ${tokens.accessToken}` })
        .send({ question: 'What are the API rate limits?' });

      expect(reply.status).toBe(HttpStatus.OK);
      expect(ai.requests).toHaveLength(1);
      expect(ai.requests[0].system).toContain('You cannot see any account');
      const stored = await prisma.askConversation.findUniqueOrThrow({
        where: { publicId: reply.body.conversationId },
      });
      expect(stored).toMatchObject({ callerType: AskCallerType.Agent, clientName: 'Orders Agent' });
    });

    it('limits account questions per workspace', async () => {
      const owner = await signUp(app, 'Busy Seller');
      quota.taken.set(
        `${ASK_ACCOUNT_QUOTA_KEY_PREFIX}${owner.workspaceId}`,
        ASK_ACCOUNT_QUESTIONS_PER_DAY,
      );
      const key = await apiKeyOf(owner);
      lookUp('mug');

      const reply = await request(app.getHttpServer())
        .post(ASK_PATH)
        .set(CLIENT_IP_HEADER, randomIp())
        .set(API_KEY_HEADER, key)
        .send({ question: 'Why did my mug fail?' });

      expect(reply.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
