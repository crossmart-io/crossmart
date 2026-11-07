import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  AiProvider,
  AskAnswerCache,
  AskChannel,
  AskDailyBudget,
  AskOutcome,
} from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import {
  InMemoryAskAnswerCache,
  InMemoryAskDailyBudget,
} from '@crossmart/core/ask/testing/ask.fakes.js';
import { PrismaService, WorkspaceRole } from '@crossmart/database';
import { CITED_ANSWER, CLIENT_IP_HEADER, randomIp, UNKNOWN_ANSWER } from './support/ask.js';
import { signUpPlatformAdmin } from './support/platform-admin.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

const ADMIN_PATH = '/api/v1/admin/ask';

// A platform admin unique to this run, set before the app reads it.
const { ADMIN_EMAIL } = vi.hoisted(() => {
  const emails = { ADMIN_EMAIL: `admin-${crypto.randomUUID()}@example.com` };
  process.env.PLATFORM_ADMIN_EMAILS = emails.ADMIN_EMAIL;
  return emails;
});

describe('Ask Crossmart admin (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let admin: SignedUpUser;
  const ai = new FakeAiProvider();

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(AiProvider)
        .useValue(ai)
        .overrideProvider(AskAnswerCache)
        .useValue(new InMemoryAskAnswerCache())
        .overrideProvider(AskDailyBudget)
        .useValue(new InMemoryAskDailyBudget()),
    );
    prisma = app.get(PrismaService);
    admin = await signUpPlatformAdmin(app, ADMIN_EMAIL);
  });

  afterAll(async () => {
    await app.close();
  });

  const asAdmin = (path: string) =>
    request(app.getHttpServer()).get(`${ADMIN_PATH}${path}`).set('Cookie', admin.cookie);

  async function ask(question: string, answer: object, channel = AskChannel.Api): Promise<string> {
    ai.clearAnswers().answerWith(answer);
    const reply = await request(app.getHttpServer())
      .post('/api/v1/ask')
      .set(CLIENT_IP_HEADER, randomIp())
      .send({ question, channel });
    expect(reply.status).toBe(HttpStatus.OK);
    return reply.body.conversationId as string;
  }

  describe('who may look', () => {
    it('tells the web app who is a platform admin', async () => {
      const someone = await signUp(app, 'Someone');

      const mine = await request(app.getHttpServer()).get('/api/v1/me').set('Cookie', admin.cookie);
      const theirs = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Cookie', someone.cookie);

      expect(mine.body.platformAdmin).toBe(true);
      expect(theirs.body.platformAdmin).toBe(false);
    });

    it('hides the admin routes from everyone else', async () => {
      const someone = await signUp(app, 'Curious User');
      const key = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${admin.workspaceId}/api-keys`)
        .set('Cookie', admin.cookie)
        .send({ name: 'Admin key', role: WorkspaceRole.ADMIN });

      const anonymous = await request(app.getHttpServer()).get(`${ADMIN_PATH}/conversations`);
      const user = await request(app.getHttpServer())
        .get(`${ADMIN_PATH}/conversations`)
        .set('Cookie', someone.cookie);
      const withKey = await request(app.getHttpServer())
        .get(`${ADMIN_PATH}/conversations`)
        .set(API_KEY_HEADER, key.body.secret);

      expect(anonymous.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(user.status).toBe(HttpStatus.NOT_FOUND);
      expect(withKey.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('refuses the admin’s address until it is verified', async () => {
      await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: { emailVerified: false } });

      const response = await asAdmin('/conversations');

      await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: { emailVerified: true } });
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('what people ask', () => {
    it('lists conversations, filtered, and shows one whole', async () => {
      const marker = randomUUID();
      const answered = await ask(
        `What are the API rate limits? ${marker}`,
        CITED_ANSWER,
        AskChannel.WebWidget,
      );
      await ask(`Does Crossmart support Amazon? ${marker}`, UNKNOWN_ANSWER);

      const widget = await asAdmin(`/conversations?channel=${AskChannel.WebWidget}&limit=100`);
      const unknown = await asAdmin(`/conversations?outcome=${AskOutcome.Unknown}&limit=100`);
      const escalated = await asAdmin('/conversations?escalated=true&limit=100');

      expect(widget.status).toBe(HttpStatus.OK);
      const widgetQuestions = widget.body.items.map(
        (item: { firstQuestion: string }) => item.firstQuestion,
      );
      expect(widgetQuestions).toContain(`What are the API rate limits? ${marker}`);
      expect(widgetQuestions).not.toContain(`Does Crossmart support Amazon? ${marker}`);
      expect(
        unknown.body.items.map((item: { lastOutcome: string }) => item.lastOutcome),
      ).not.toContain(AskOutcome.Answered);
      expect(escalated.body.items.every((item: { escalated: boolean }) => item.escalated)).toBe(
        true,
      );

      const stored = await prisma.askConversation.findUniqueOrThrow({
        where: { publicId: answered },
      });
      const detail = await asAdmin(`/conversations/${stored.id}`);
      expect(detail.status).toBe(HttpStatus.OK);
      expect(detail.body.turns).toHaveLength(1);
      expect(detail.body.turns[0]).toMatchObject({ outcome: AskOutcome.Answered, position: 1 });
      expect(detail.body.turns[0].citations.length).toBeGreaterThan(0);
    });

    it('counts the questions asked most, and the ones it could not answer', async () => {
      const question = `How do I connect Etsy? ${randomUUID()}`;
      for (let asked = 0; asked < 3; asked += 1) await ask(question, UNKNOWN_ANSWER);
      const from = new Date(Date.now() - 60_000).toISOString();

      const top = await asAdmin(`/questions/top?from=${from}&limit=100`);
      const unanswered = await asAdmin(`/questions/unanswered?from=${from}&limit=100`);

      expect(top.status).toBe(HttpStatus.OK);
      expect(top.body).toContainEqual(expect.objectContaining({ question, count: 3 }));
      expect(unanswered.body).toContainEqual(expect.objectContaining({ question, count: 3 }));
    });

    it('answers 404 for a conversation that does not exist', async () => {
      expect((await asAdmin(`/conversations/${randomUUID()}`)).status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
