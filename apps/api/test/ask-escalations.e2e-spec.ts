import { createHmac, randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { MailSender } from '@crossmart/common';
import {
  AiProvider,
  AskAnswerCache,
  AskDailyBudget,
  AskEscalationReason,
  AskEscalationStatus,
  AskQuota,
  ASK_ESCALATION_REPLIED_EVENT,
  ASK_ESCALATIONS_PER_DAY,
} from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import {
  InMemoryAskAnswerCache,
  InMemoryAskDailyBudget,
  InMemoryAskQuota,
} from '@crossmart/core/ask/testing/ask.fakes.js';
import { PrismaService } from '@crossmart/database';
import { CLIENT_IP_HEADER, randomIp, UNKNOWN_ANSWER } from './support/ask.js';
import { signUpPlatformAdmin } from './support/platform-admin.js';
import { RecordingMailSender } from './support/recording-mail.sender.js';
import { createTestApp } from './support/test-app.js';
import { type ReceivedWebhook, WebhookReceiver } from './support/webhook-receiver.js';

const SIGNATURE_HEADER = 'crossmart-signature';
const ESCALATIONS_PATH = '/api/v1/ask/escalations';

// Set before the app reads them: the team's address, a platform admin unique to this run, and
// a trusted network, so the local receiver may get the callback.
const { ADMIN_EMAIL, TEAM_EMAIL } = vi.hoisted(() => {
  const emails = {
    ADMIN_EMAIL: `admin-${crypto.randomUUID()}@example.com`,
    TEAM_EMAIL: 'team@example.com',
  };
  Object.assign(process.env, {
    PLATFORM_ADMIN_EMAILS: emails.ADMIN_EMAIL,
    ASK_ESCALATION_EMAIL: emails.TEAM_EMAIL,
    WEBHOOK_ALLOW_PRIVATE_URLS: 'true',
  });
  return emails;
});

/** Verifies the callback as a receiver would: HMAC-SHA256 of `t.body` with the secret. */
function verifies(received: ReceivedWebhook, secret: string): boolean {
  const parts = String(received.headers[SIGNATURE_HEADER]).split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) ?? '';
  const signature = parts.find((part) => part.startsWith('v1='))?.slice(3);
  return (
    createHmac('sha256', secret).update(`${timestamp}.${received.body}`).digest('hex') === signature
  );
}

describe('Ask Crossmart escalations (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let receiver: WebhookReceiver;
  let adminCookie: string;
  const ai = new FakeAiProvider();
  const mail = new RecordingMailSender();

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(AiProvider)
        .useValue(ai)
        .overrideProvider(AskAnswerCache)
        .useValue(new InMemoryAskAnswerCache())
        .overrideProvider(AskDailyBudget)
        .useValue(new InMemoryAskDailyBudget())
        .overrideProvider(AskQuota)
        .useValue(new InMemoryAskQuota())
        .overrideProvider(MailSender)
        .useValue(mail),
    );
    prisma = app.get(PrismaService);
    receiver = new WebhookReceiver();
    await receiver.start();
    adminCookie = (await signUpPlatformAdmin(app, ADMIN_EMAIL)).cookie;
  });

  beforeEach(() => {
    ai.clearAnswers().answerWith(UNKNOWN_ANSWER);
  });

  afterAll(async () => {
    await receiver.stop();
    await app.close();
  });

  async function conversationOf(ip: string): Promise<string> {
    const reply = await request(app.getHttpServer())
      .post('/api/v1/ask')
      .set(CLIENT_IP_HEADER, ip)
      .send({ question: `Do you have an Enterprise contract for us? ${randomUUID()}` });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.escalation.offered).toBe(true);
    return reply.body.conversationId as string;
  }

  const escalate = (ip: string, body: Record<string, unknown>) =>
    request(app.getHttpServer()).post(ESCALATIONS_PATH).set(CLIENT_IP_HEADER, ip).send(body);

  it('hands the conversation to the team, and sends their reply back every way', async () => {
    const ip = randomIp();
    const conversationId = await conversationOf(ip);

    const opened = await escalate(ip, {
      conversationId,
      contactEmail: 'owner@example.com',
      callbackUrl: receiver.url,
    });

    expect(opened.status).toBe(HttpStatus.CREATED);
    expect(opened.body).toMatchObject({ status: AskEscalationStatus.Open, reply: null });
    expect(opened.body.id).toMatch(/^esc_[A-Za-z0-9_-]{40,}$/);
    expect(opened.body.callbackSecret).toMatch(/^whsec_/);
    const teamEmail = await mail.lastTo(TEAM_EMAIL);
    expect(teamEmail.text).toContain('Do you have an Enterprise contract for us?');
    expect(teamEmail.text).toContain('/admin/ask/');

    const stored = await prisma.askEscalation.findFirstOrThrow({
      where: { conversation: { publicId: conversationId } },
    });
    expect(JSON.stringify(stored)).not.toContain(opened.body.id);
    const reply = await request(app.getHttpServer())
      .post(`/api/v1/admin/ask/escalations/${stored.id}/reply`)
      .set('Cookie', adminCookie)
      .send({ reply: 'We will send you a quote today.' });

    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body).toMatchObject({
      status: AskEscalationStatus.Replied,
      repliedBy: ADMIN_EMAIL,
    });
    expect(reply.body.callbackDeliveredAt).not.toBeNull();
    const callback = receiver.received.at(-1) as ReceivedWebhook;
    expect(verifies(callback, opened.body.callbackSecret)).toBe(true);
    expect(JSON.parse(callback.body)).toMatchObject({
      type: ASK_ESCALATION_REPLIED_EVENT,
      data: { conversationId, reply: 'We will send you a quote today.' },
    });
    expect((await mail.lastTo('owner@example.com')).text).toContain(
      'We will send you a quote today.',
    );

    const polled = await request(app.getHttpServer()).get(`${ESCALATIONS_PATH}/${opened.body.id}`);
    expect(polled.status).toBe(HttpStatus.OK);
    expect(polled.body).toMatchObject({
      status: AskEscalationStatus.Replied,
      reply: 'We will send you a quote today.',
      reason: AskEscalationReason.Sales,
    });
    const again = await request(app.getHttpServer())
      .post(`/api/v1/admin/ask/escalations/${stored.id}/reply`)
      .set('Cookie', adminCookie)
      .send({ reply: 'Twice' });
    expect(again.status).toBe(HttpStatus.CONFLICT);
  });

  it('lets only the caller who had the conversation escalate it', async () => {
    const conversationId = await conversationOf(randomIp());

    const response = await escalate(randomIp(), { conversationId });

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('reads a ticket only by its id', async () => {
    const unknown = await request(app.getHttpServer()).get(
      `${ESCALATIONS_PATH}/esc_${randomUUID()}`,
    );
    const malformed = await request(app.getHttpServer()).get(`${ESCALATIONS_PATH}/${randomUUID()}`);

    expect(unknown.status).toBe(HttpStatus.NOT_FOUND);
    expect(malformed.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('refuses a callback URL that is not one', async () => {
    const ip = randomIp();
    const response = await escalate(ip, {
      conversationId: await conversationOf(ip),
      callbackUrl: 'ftp://example.com/hook',
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it(`opens at most ${ASK_ESCALATIONS_PER_DAY} escalations a day per caller`, async () => {
    const ip = randomIp();
    const conversationId = await conversationOf(ip);
    for (let opened = 0; opened < ASK_ESCALATIONS_PER_DAY; opened += 1) {
      expect((await escalate(ip, { conversationId })).status).toBe(HttpStatus.CREATED);
    }

    const response = await escalate(ip, { conversationId });

    expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });
});
