import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { AiProvider, AskAnswerCache, AskChannel, AskDailyBudget, AskQuota } from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import {
  InMemoryAskAnswerCache,
  InMemoryAskDailyBudget,
  InMemoryAskQuota,
} from '@crossmart/core/ask/testing/ask.fakes.js';
import { PrismaService, WorkspaceRole } from '@crossmart/database';
import { CITED_ANSWER, CLIENT_IP_HEADER, randomIp, UNKNOWN_ANSWER } from './support/ask.js';
import { createTestApp, signUp } from './support/test-app.js';

const A2A_PATH = '/a2a';
const AGENT_CARD_PATH = '/.well-known/agent-card.json';
const VERSION_HEADER = 'A2A-Version';
const VERSION = '1.0';

/**
 * The basic task execution of A2A 1.0 §6.1 ("Client asks a question and receives a completed
 * task response"), as the JSON-RPC binding of §9.4.1 carries it.
 */
function specSendMessage(text: string, extra: Record<string, unknown> = {}) {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'SendMessage',
    params: {
      message: { role: 'ROLE_USER', parts: [{ text }], messageId: randomUUID(), ...extra },
    },
  };
}

describe('A2A (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const ai = new FakeAiProvider();

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
        .useValue(new InMemoryAskQuota()),
    );
    prisma = app.get(PrismaService);
  });

  beforeEach(() => {
    ai.clearAnswers().answerWith(CITED_ANSWER);
  });

  afterAll(async () => {
    await app.close();
  });

  const rpc = (body: unknown, ip = randomIp()) =>
    request(app.getHttpServer())
      .post(A2A_PATH)
      .set(CLIENT_IP_HEADER, ip)
      .set(VERSION_HEADER, VERSION)
      .send(body as object);

  describe('the Agent Card', () => {
    it('is served at the well-known URI with the fields A2A 1.0 requires', async () => {
      const response = await request(app.getHttpServer()).get(AGENT_CARD_PATH);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.headers['cache-control']).toContain('max-age=');
      expect(response.headers.etag).toBeDefined();
      const card = response.body;
      for (const field of [
        'name',
        'description',
        'supportedInterfaces',
        'version',
        'capabilities',
        'defaultInputModes',
        'defaultOutputModes',
        'skills',
      ]) {
        expect(card).toHaveProperty(field);
      }
      expect(card.name).toBe('Crossmart');
      expect(card.provider).toEqual({
        organization: 'YIOT LLC (crossmart.io)',
        url: 'https://crossmart.io',
      });
      expect(card.supportedInterfaces[0]).toMatchObject({
        protocolBinding: 'JSONRPC',
        protocolVersion: VERSION,
      });
      expect(card.supportedInterfaces[0].url).toMatch(/\/a2a$/);
      expect(card.skills.map((skill: { id: string }) => skill.id)).toEqual([
        'ask_about_crossmart',
        'account_help',
        'escalate_to_human',
      ]);
      for (const skill of card.skills) {
        expect(skill).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            tags: expect.any(Array),
          }),
        );
      }
    });

    it('is not under the versioned API prefix', async () => {
      expect((await request(app.getHttpServer()).get(`/api/v1${AGENT_CARD_PATH}`)).status).toBe(
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('SendMessage', () => {
    it('answers the specification’s basic task example with a completed task', async () => {
      const response = await rpc(specSendMessage('What are the API rate limits?'));

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({ jsonrpc: '2.0', id: 1 });
      const { task } = response.body.result;
      expect(task.status.state).toBe('TASK_STATE_COMPLETED');
      expect(task.contextId).toMatch(/^conv_/);
      expect(task.artifacts[0].parts[0]).toEqual({ text: CITED_ANSWER.answer });
      expect(task.artifacts[0].parts[1].data).toMatchObject({
        outcome: 'answered',
        citations: expect.any(Array),
      });
      expect(task.history.map((message: { role: string }) => message.role)).toEqual([
        'ROLE_USER',
        'ROLE_AGENT',
      ]);
      const stored = await prisma.askConversation.findUniqueOrThrow({
        where: { publicId: task.contextId },
      });
      expect(stored.channel).toBe(AskChannel.A2a);
    });

    it('continues the conversation named by contextId, and only for the same caller', async () => {
      const ip = randomIp();
      const first = await rpc(specSendMessage(`What are the API rate limits? ${randomUUID()}`), ip);
      const { contextId } = first.body.result.task;

      const followUp = await rpc(specSendMessage('And per day?', { contextId }), ip);
      const stranger = await rpc(specSendMessage('And per day?', { contextId }), randomIp());

      expect(followUp.body.result.task.contextId).toBe(contextId);
      expect(ai.requests.at(-1)?.prompt).toContain('<conversation>');
      expect(stranger.body.error.code).toBe(-32602);
    });

    it('offers a person on the status when it cannot answer, and escalates with a data part', async () => {
      ai.clearAnswers().answerWith(UNKNOWN_ANSWER);
      const ip = randomIp();
      const first = await rpc(
        specSendMessage(`Does Crossmart support Amazon? ${randomUUID()}`),
        ip,
      );
      const { contextId, status } = first.body.result.task;
      expect(status.message.parts[0].text).toContain('escalate');

      const escalated = await rpc(
        {
          jsonrpc: '2.0',
          id: 'esc',
          method: 'SendMessage',
          params: {
            message: {
              role: 'ROLE_USER',
              messageId: randomUUID(),
              contextId,
              parts: [{ data: { action: 'escalate', contactEmail: 'agent-owner@example.com' } }],
            },
          },
        },
        ip,
      );

      const ticket = escalated.body.result.task;
      expect(ticket.id).toMatch(/^esc_/);
      expect(ticket.status.state).toBe('TASK_STATE_WORKING');
      const polled = await rpc({
        jsonrpc: '2.0',
        id: 2,
        method: 'GetTask',
        params: { id: ticket.id },
      });
      expect(polled.body.result.status.state).toBe('TASK_STATE_WORKING');
    });

    it('lets an agent with a key ask about its own workspace', async () => {
      const owner = await signUp(app, 'A2A Seller');
      const key = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
        .set('Cookie', owner.cookie)
        .send({ name: 'A2A agent', role: WorkspaceRole.VIEWER });
      ai.requests.length = 0;

      const response = await rpc(specSendMessage('Which of my listings failed?')).set(
        API_KEY_HEADER,
        key.body.secret,
      );

      expect(response.body.result.task.status.state).toBe('TASK_STATE_COMPLETED');
      expect(ai.requests[0].system).toContain('failed_listings');
    });

    it('refuses files, empty questions and continuing a completed task', async () => {
      const file = await rpc({
        ...specSendMessage('x'),
        params: {
          message: {
            role: 'ROLE_USER',
            messageId: randomUUID(),
            parts: [{ url: 'https://example.com/a.pdf' }],
          },
        },
      });
      const empty = await rpc({
        ...specSendMessage('x'),
        params: {
          message: { role: 'ROLE_USER', messageId: randomUUID(), parts: [{ text: '  ' }] },
        },
      });
      const ip = randomIp();
      const first = await rpc(specSendMessage(`rate limits ${randomUUID()}`), ip);
      const continued = await rpc(
        specSendMessage('more', { taskId: first.body.result.task.id }),
        ip,
      );

      expect(file.body.error.code).toBe(-32005);
      expect(empty.body.error.code).toBe(-32602);
      expect(continued.body.error.code).toBe(-32004);
    });
  });

  describe('tasks', () => {
    it('gets, lists and refuses to cancel the caller’s tasks, and hides others’', async () => {
      const ip = randomIp();
      const sent = await rpc(specSendMessage(`rate limits ${randomUUID()}`), ip);
      const { id, contextId } = sent.body.result.task;

      const got = await rpc(
        { jsonrpc: '2.0', id: 2, method: 'GetTask', params: { id, historyLength: 1 } },
        ip,
      );
      const hidden = await rpc(
        { jsonrpc: '2.0', id: 2, method: 'GetTask', params: { id } },
        randomIp(),
      );
      const listed = await rpc(
        { jsonrpc: '2.0', id: 3, method: 'ListTasks', params: { contextId } },
        ip,
      );
      const canceled = await rpc(
        { jsonrpc: '2.0', id: 4, method: 'CancelTask', params: { id } },
        ip,
      );

      expect(got.body.result).toMatchObject({
        id,
        contextId,
        status: { state: 'TASK_STATE_COMPLETED' },
      });
      expect(got.body.result.history).toHaveLength(1);
      expect(hidden.body.error).toMatchObject({ code: -32001, message: 'Task not found' });
      expect(hidden.body.error.data[0]).toMatchObject({
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'TASK_NOT_FOUND',
      });
      expect(listed.body.result).toMatchObject({ nextPageToken: '', totalSize: 1, pageSize: 50 });
      expect(listed.body.result.tasks[0].id).toBe(id);
      expect(listed.body.result.tasks[0]).not.toHaveProperty('artifacts');
      expect(canceled.body.error.code).toBe(-32002);
    });
  });

  describe('the protocol', () => {
    it('refuses a request without the 1.0 version, which means 0.3', async () => {
      const response = await request(app.getHttpServer())
        .post(A2A_PATH)
        .set(CLIENT_IP_HEADER, randomIp())
        .send(specSendMessage('rate limits'));

      expect(response.body.error.code).toBe(-32009);
    });

    it('takes the version as a query parameter too', async () => {
      const response = await request(app.getHttpServer())
        .post(`${A2A_PATH}?A2A-Version=1.0`)
        .set(CLIENT_IP_HEADER, randomIp())
        .send({ jsonrpc: '2.0', id: 9, method: 'ListTasks' });

      expect(response.body.result.tasks).toEqual([]);
    });

    it('answers JSON-RPC errors for bad envelopes, unknown and unsupported methods', async () => {
      const invalid = await rpc({ id: 1, method: 'SendMessage' });
      const unknown = await rpc({ jsonrpc: '2.0', id: 2, method: 'message/send', params: {} });
      const streaming = await rpc({ ...specSendMessage('x'), method: 'SendStreamingMessage' });
      const push = await rpc({
        jsonrpc: '2.0',
        id: 3,
        method: 'CreateTaskPushNotificationConfig',
        params: {},
      });
      const extended = await rpc({ jsonrpc: '2.0', id: 4, method: 'GetExtendedAgentCard' });

      expect(invalid.body).toMatchObject({ jsonrpc: '2.0', id: 1, error: { code: -32600 } });
      expect(unknown.body.error.code).toBe(-32601);
      expect(streaming.body.error.code).toBe(-32004);
      expect(push.body.error.code).toBe(-32003);
      expect(extended.body.error.code).toBe(-32004);
    });

    it('refuses a wrong key instead of treating the caller as anonymous', async () => {
      const response = await rpc(specSendMessage('rate limits')).set(API_KEY_HEADER, 'cm_wrong');

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
