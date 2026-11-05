import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AgentClientSweeper } from '@crossmart/core';
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
});
