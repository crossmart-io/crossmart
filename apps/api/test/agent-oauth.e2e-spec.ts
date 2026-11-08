import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AgentClientSweeper, OutsideAgentChanges } from '@crossmart/core';
import { PrismaService } from '@crossmart/database';
import {
  type AgentTokens,
  connectAgent,
  MCP_RESOURCE,
  registerAgent,
} from './support/agent-oauth.js';
import { createTestApp, type SignedUpUser, signUp } from './support/test-app.js';

describe('Agents connected with OAuth (ADR 0019)', () => {
  let app: INestApplication<App>;
  const server = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function asAgent(tokens: AgentTokens) {
    return { Authorization: `Bearer ${tokens.accessToken}` };
  }

  function createProduct(workspaceId: string, tokens: AgentTokens, title: string) {
    return server()
      .post(`/api/v1/workspaces/${workspaceId}/products`)
      .set(asAgent(tokens))
      .send({ title, variants: [{ price: '10' }] });
  }

  /** These tests are about access, not approvals (ADR 0028): let the agent's writes apply. */
  async function letAgentsApplyDirectly({ cookie, workspaceId }: SignedUpUser) {
    const response = await server()
      .patch(`/api/v1/workspaces/${workspaceId}`)
      .set('Cookie', cookie)
      .send({ outsideAgentChanges: OutsideAgentChanges.ApplyDirectly });
    expect(response.status).toBe(HttpStatus.OK);
  }

  async function connectionsOf({ cookie, workspaceId }: SignedUpUser) {
    const response = await server()
      .get(`/api/v1/workspaces/${workspaceId}/agent-connections`)
      .set('Cookie', cookie);
    expect(response.status).toBe(HttpStatus.OK);
    return response.body as { id: string; clientName: string; scopes: string[] }[];
  }

  describe('discovery and registration', () => {
    it('publishes authorization server metadata at the root, with CIMD and the agent scopes', async () => {
      const response = await server().get('/.well-known/oauth-authorization-server/api/auth');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        client_id_metadata_document_supported: true,
        code_challenge_methods_supported: ['S256'],
      });
      expect(response.body.token_endpoint_auth_methods_supported).toEqual(
        expect.arrayContaining(['none', 'private_key_jwt']),
      );
      expect(response.body.scopes_supported).toEqual(
        expect.arrayContaining(['catalog:read', 'suggestions:write', 'offline_access']),
      );
    });

    it('lets signed-in users read a client’s public details, never create or change clients', async () => {
      const user = await signUp(app, 'Ari');
      const clientId = await registerAgent(app, 'Shown Agent');

      const details = await server()
        .get('/api/auth/oauth2/public-client')
        .query({ client_id: clientId })
        .set('Cookie', user.cookie);
      const created = await server()
        .post('/api/auth/oauth2/create-client')
        .set('Cookie', user.cookie)
        .send({ client_name: 'Mine', redirect_uris: ['https://agent.example/cb'] });

      expect(details.body.client_name).toBe('Shown Agent');
      expect(created.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('registers public clients only', async () => {
      const response = await server()
        .post('/api/auth/oauth2/register')
        .send({ client_name: 'Secret keeper', redirect_uris: ['https://agent.example/cb'] });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error).toBe('invalid_client_metadata');
    });
  });

  describe('an agent with full access', () => {
    let user: SignedUpUser;
    let tokens: AgentTokens;

    beforeAll(async () => {
      user = await signUp(app, 'Dana');
      await letAgentsApplyDirectly(user);
      tokens = await connectAgent(app, user, { clientId: await registerAgent(app, 'Test Agent') });
    });

    it('gets a token for the MCP server, scoped to the picked workspace', () => {
      const claims = JSON.parse(
        Buffer.from(tokens.accessToken.split('.')[1] ?? '', 'base64url').toString(),
      );

      expect(claims).toMatchObject({
        aud: MCP_RESOURCE,
        'https://crossmart.io/workspace_id': user.workspaceId,
      });
    });

    it('works in its workspace, and the activity log names the agent and the user', async () => {
      const created = await createProduct(user.workspaceId, tokens, 'Agent Mug');
      expect(created.status).toBe(HttpStatus.CREATED);

      const activity = await server()
        .get(`/api/v1/workspaces/${user.workspaceId}/activity`)
        .set('Cookie', user.cookie);
      expect(activity.body.items[0].actor).toMatchObject({
        type: 'AGENT',
        name: 'Dana',
        agentName: 'Test Agent',
      });
    });

    it('cannot reach routes outside a workspace, nor what its scopes never cover', async () => {
      const me = await server().get('/api/v1/me').set(asAgent(tokens));
      const keys = await server()
        .get(`/api/v1/workspaces/${user.workspaceId}/api-keys`)
        .set(asAgent(tokens));

      expect(me.status).toBe(HttpStatus.FORBIDDEN);
      expect(keys.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('cannot act in another workspace', async () => {
      const other = await signUp(app, 'Eli');

      const response = await server()
        .get(`/api/v1/workspaces/${other.workspaceId}/products`)
        .set(asAgent(tokens));

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  it('keeps to read-only when the user accepts only reading', async () => {
    const user = await signUp(app, 'Noa');
    const tokens = await connectAgent(app, user, {
      clientId: await registerAgent(app, 'Reader'),
      acceptedScope: 'catalog:read',
    });

    const read = await server()
      .get(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set(asAgent(tokens));
    const write = await createProduct(user.workspaceId, tokens, 'Not allowed');

    expect(read.status).toBe(HttpStatus.OK);
    expect(write.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('refuses a workspace the user does not belong to', async () => {
    const user = await signUp(app, 'Gal');
    const stranger = await signUp(app, 'Tom');

    const response = await server()
      .post('/api/v1/oauth/workspace')
      .set('Cookie', user.cookie)
      .send({ workspaceId: stranger.workspaceId });

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('lists connections and stops the agent at once when one is revoked', async () => {
    const user = await signUp(app, 'Maya');
    const tokens = await connectAgent(app, user, {
      clientId: await registerAgent(app, 'Revocable'),
    });
    const [connection] = await connectionsOf(user);
    expect(connection).toMatchObject({ clientName: 'Revocable' });

    const revoked = await server()
      .delete(`/api/v1/workspaces/${user.workspaceId}/agent-connections/${connection?.id}`)
      .set('Cookie', user.cookie);
    const afterwards = await server()
      .get(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set(asAgent(tokens));

    expect(revoked.status).toBe(HttpStatus.NO_CONTENT);
    expect(afterwards.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(await connectionsOf(user)).toEqual([]);
  });

  it('refuses a token that is not a valid agent token', async () => {
    const user = await signUp(app, 'Ido');

    const response = await server()
      .get(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set({ Authorization: 'Bearer not-a-token' });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('deletes registrations never used within a day, and keeps used ones', async () => {
    const user = await signUp(app, 'Lior');
    const unused = await registerAgent(app, 'Abandoned');
    const used = await registerAgent(app, 'Busy');
    await connectAgent(app, user, { clientId: used });
    const prisma = app.get(PrismaService);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await prisma.oauthClient.updateMany({
      where: { clientId: { in: [unused, used] } },
      data: { createdAt: twoDaysAgo },
    });

    await app.get(AgentClientSweeper, { strict: false }).sweep();

    const remaining = await prisma.oauthClient.findMany({
      where: { clientId: { in: [unused, used] } },
      select: { clientId: true },
    });
    expect(remaining).toEqual([{ clientId: used }]);
  });

  describe('clients nobody used for 90 days', () => {
    const LONG_AGO = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const IN_A_WEEK = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    /** Connects an agent that then acts once, and moves all of it 100 days into the past. */
    async function agedAgent(user: SignedUpUser, name: string) {
      const clientId = await registerAgent(app, name);
      const tokens = await connectAgent(app, user, { clientId });
      await letAgentsApplyDirectly(user);
      await createProduct(user.workspaceId, tokens, `${name} mug`);
      const prisma = app.get(PrismaService);
      const where = { clientId };
      await prisma.$transaction([
        prisma.oauthClient.updateMany({
          where,
          data: { createdAt: LONG_AGO, updatedAt: LONG_AGO },
        }),
        prisma.oauthAccessToken.updateMany({
          where,
          data: { createdAt: LONG_AGO, expiresAt: LONG_AGO },
        }),
        prisma.oauthRefreshToken.updateMany({
          where,
          data: { createdAt: LONG_AGO, expiresAt: LONG_AGO },
        }),
        prisma.activityEvent.updateMany({
          where: { actorOAuthClientId: clientId },
          data: { createdAt: LONG_AGO },
        }),
      ]);
      return clientId;
    }

    async function disconnect(user: SignedUpUser) {
      for (const connection of await connectionsOf(user)) {
        await server()
          .delete(`/api/v1/workspaces/${user.workspaceId}/agent-connections/${connection.id}`)
          .set('Cookie', user.cookie);
      }
    }

    async function activityOf({ cookie, workspaceId }: SignedUpUser) {
      const response = await server()
        .get(`/api/v1/workspaces/${workspaceId}/activity`)
        .set('Cookie', cookie);
      return response.body.items as {
        summary: string;
        actor: { type: string; agentName: string | null };
      }[];
    }

    async function remainingOf(clientIds: string[]) {
      const clients = await app.get(PrismaService).oauthClient.findMany({
        where: { clientId: { in: clientIds } },
        select: { clientId: true },
      });
      return clients.map(({ clientId }) => clientId);
    }

    it('deletes disconnected ones, keeps their name in the history, and logs the removal', async () => {
      const user = await signUp(app, 'Rina');
      const stale = await agedAgent(user, 'Old Helper');
      await disconnect(user);
      const sweeper = app.get(AgentClientSweeper, { strict: false });

      const first = await sweeper.sweep();
      const second = await sweeper.sweep();

      expect(await remainingOf([stale])).toEqual([]);
      expect(first.stale).toBeGreaterThanOrEqual(1);
      expect(second.stale).toBe(0);
      const activity = await activityOf(user);
      expect(activity[0]?.summary).toBe('Removed 1 unused agent: Old Helper');
      expect(activity.find((event) => event.actor.type === 'AGENT')?.actor.agentName).toBe(
        'Old Helper',
      );
    });

    it('keeps one still connected, and one holding a refresh token that has not expired', async () => {
      const connected = await agedAgent(await signUp(app, 'Shai'), 'Still Connected');
      const holder = await signUp(app, 'Yael');
      const withToken = await agedAgent(holder, 'Token Holder');
      await disconnect(holder);
      await app.get(PrismaService).oauthRefreshToken.updateMany({
        where: { clientId: withToken },
        data: { expiresAt: IN_A_WEEK },
      });

      await app.get(AgentClientSweeper, { strict: false }).sweep();

      expect((await remainingOf([connected, withToken])).sort()).toEqual(
        [connected, withToken].sort(),
      );
    });
  });

  describe('the agent shown on the consent page', () => {
    it('marks a self-registered agent’s name as unverified', async () => {
      const user = await signUp(app, 'Omer');
      const clientId = await registerAgent(app, 'Claude');

      const response = await server()
        .get('/api/v1/oauth/client')
        .query({ clientId })
        .set('Cookie', user.cookie);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual({
        clientId,
        name: 'Claude',
        registration: 'dynamic',
        verifiedHost: null,
        claimedHost: null,
      });
    });

    it('answers not found for an unknown agent, and refuses callers who are not signed in', async () => {
      const user = await signUp(app, 'Hila');

      const unknown = await server()
        .get('/api/v1/oauth/client')
        .query({ clientId: 'no-such-client' })
        .set('Cookie', user.cookie);
      const anonymous = await server().get('/api/v1/oauth/client').query({ clientId: 'x' });

      expect(unknown.status).toBe(HttpStatus.NOT_FOUND);
      expect(anonymous.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
