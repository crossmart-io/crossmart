import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER, AppConfigService } from '@crossmart/common';
import {
  AiFeature,
  AiProvider,
  AskAnswerCache,
  AskConfidence,
  AskDailyBudget,
  AskOutcome,
  ASK_QUESTION_MAX_LENGTH,
  askDailyLimitMessage,
} from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import {
  InMemoryAskAnswerCache,
  InMemoryAskDailyBudget,
} from '@crossmart/core/ask/testing/ask.fakes.js';
import { PrismaService, WorkspaceRole } from '@crossmart/database';
import { ASK_ANONYMOUS_PER_MINUTE, ASK_RATE_LIMITED_MESSAGE } from '../src/ask/ask.constants.js';
import { connectAgent, registerAgent } from './support/agent-oauth.js';
import { createTestApp, signUp } from './support/test-app.js';

const CLIENT_IP_HEADER = 'x-real-ip';
const CITED = {
  outcome: AskOutcome.Answered,
  answer: 'Past a limit the API answers 429 with a Retry-After header.',
  sourceIds: ['S1'],
  confidence: AskConfidence.High,
};

/** A fresh address per test, so rate-limit windows in Redis never carry over between runs. */
function randomIp(): string {
  const bytes = randomUUID().replaceAll('-', '').slice(0, 6);
  return `10.${parseInt(bytes.slice(0, 2), 16)}.${parseInt(bytes.slice(2, 4), 16)}.${parseInt(bytes.slice(4, 6), 16)}`;
}

describe('Ask Crossmart (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const ai = new FakeAiProvider();
  const budget = new InMemoryAskDailyBudget();

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(AiProvider)
        .useValue(ai)
        .overrideProvider(AskAnswerCache)
        .useValue(new InMemoryAskAnswerCache())
        .overrideProvider(AskDailyBudget)
        .useValue(budget),
    );
    prisma = app.get(PrismaService);
    ai.answerWith(CITED);
  });

  afterEach(() => {
    budget.taken = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  const ask = (question: string, ip = randomIp()) =>
    request(app.getHttpServer()).post('/api/v1/ask').set(CLIENT_IP_HEADER, ip).send({ question });

  it('answers anonymous callers from the docs, citing pages, and meters the platform', async () => {
    const before = await prisma.platformAiUsage.count({ where: { feature: AiFeature.Ask } });

    const response = await ask(`What are the API rate limits? ${randomUUID()}`);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      outcome: AskOutcome.Answered,
      answer: CITED.answer,
      confidence: AskConfidence.High,
      handoff: false,
    });
    expect(response.body.citations).toHaveLength(1);
    expect(response.body.citations[0].url).toMatch(/^https:\/\//);
    expect(await prisma.platformAiUsage.count({ where: { feature: AiFeature.Ask } })).toBe(
      before + 1,
    );
  });

  it('says it does not know, without calling the model, when the docs have nothing on it', async () => {
    const calls = ai.requests.length;

    const response = await ask('zxqv blorptastic');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({ outcome: AskOutcome.Unknown, handoff: true });
    expect(ai.requests).toHaveLength(calls);
  });

  it('never puts workspace data in the prompt', async () => {
    const owner = await signUp(app, 'Private Seller');
    const secret = `Zanzibarmug${randomUUID().slice(0, 8)}`;
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', owner.cookie)
      .send({ title: secret, variants: [{ price: '9' }] });

    await request(app.getHttpServer())
      .post('/api/v1/ask')
      .set('Cookie', owner.cookie)
      .send({ question: `How do I publish ${secret} to eBay?` });

    const prompts = ai.requests.map((sent) =>
      sent.prompt.replace(/<question>[\s\S]*<\/question>/, ''),
    );
    expect(prompts.some((prompt) => prompt.includes(secret))).toBe(false);
  });

  it('validates the question', async () => {
    expect((await ask('')).status).toBe(HttpStatus.BAD_REQUEST);
    expect((await ask('x'.repeat(ASK_QUESTION_MAX_LENGTH + 1))).status).toBe(
      HttpStatus.BAD_REQUEST,
    );
    const extra = await request(app.getHttpServer())
      .post('/api/v1/ask')
      .send({ question: 'rate limits?', workspaceId: randomUUID() });
    expect(extra.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('refuses a wrong API key instead of treating the caller as anonymous', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ask')
      .set(API_KEY_HEADER, 'cm_not_a_real_key')
      .send({ question: 'rate limits?' });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('limits anonymous callers per IP, and gives API keys more room', async () => {
    const ip = randomIp();
    for (let call = 0; call < ASK_ANONYMOUS_PER_MINUTE; call += 1) {
      expect((await ask(`rate limits ${call}`, ip)).status).toBe(HttpStatus.OK);
    }

    const limited = await ask('rate limits again', ip);

    expect(limited.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(limited.body.message).toBe(ASK_RATE_LIMITED_MESSAGE);
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);

    const owner = await signUp(app, 'Agent Builder');
    const key = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Agent', role: WorkspaceRole.VIEWER });
    const withKey = await request(app.getHttpServer())
      .post('/api/v1/ask')
      .set(CLIENT_IP_HEADER, ip)
      .set(API_KEY_HEADER, key.body.secret)
      .send({ question: 'rate limits with a key' });
    expect(withKey.status).toBe(HttpStatus.OK);
  });

  it('refuses a wrong agent token instead of treating the caller as anonymous', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ask')
      .set({ Authorization: 'Bearer not.a.token' })
      .send({ question: 'rate limits?' });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('answers a connected agent past the anonymous limit, as an identified caller', async () => {
    const ip = randomIp();
    for (let call = 0; call < ASK_ANONYMOUS_PER_MINUTE; call += 1) {
      expect((await ask(`agent limits ${call}`, ip)).status).toBe(HttpStatus.OK);
    }
    const owner = await signUp(app, 'Agent Owner');
    const tokens = await connectAgent(app, owner, {
      clientId: await registerAgent(app, 'Asking Agent'),
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/ask')
      .set(CLIENT_IP_HEADER, ip)
      .set({ Authorization: `Bearer ${tokens.accessToken}` })
      .send({ question: 'rate limits for an agent' });

    expect(response.status).toBe(HttpStatus.OK);
  });

  it('answers 503 once the platform’s daily questions are spent', async () => {
    budget.taken = Number.MAX_SAFE_INTEGER;

    const response = await ask(`What are the rate limits? ${randomUUID()}`);

    expect(response.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(response.body.message).toBe(
      askDailyLimitMessage(app.get(AppConfigService).askSettings.supportEmail),
    );
  });
});
