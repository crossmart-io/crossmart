import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { MCP_RESOURCE } from './support/agent-oauth.js';
import { createTestApp, signUp } from './support/test-app.js';

/** The MCP server's Protected Resource Metadata, for the test API's `MCP_PUBLIC_URL`. */
const PROTECTED_RESOURCE_METADATA = `${new URL(MCP_RESOURCE).origin}/.well-known/oauth-protected-resource/mcp`;
const METADATA_PATHS = [
  '/.well-known/oauth-authorization-server/api/auth',
  '/.well-known/oauth-authorization-server',
  '/api/auth/.well-known/oauth-authorization-server',
];

describe('Agent sign-up discovery: auth.md (ADR 0019)', () => {
  let app: INestApplication<App>;
  const server = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(METADATA_PATHS)(
    'adds the agent_auth block to the authorization server metadata at %s',
    async (path) => {
      const response = await server().get(path);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.agent_auth).toEqual({
        skill: 'https://crossmart.io/auth.md',
        identity_types_supported: [],
        sandbox_account_endpoint: expect.stringMatching(/\/api\/v1\/sandbox-accounts$/),
      });
      expect(response.body.revocation_endpoint).toMatch(/\/api\/auth\/oauth2\/revoke$/);
      expect(response.body.client_id_metadata_document_supported).toBe(true);
    },
  );

  it('points a request without a credential to the protected resource metadata', async () => {
    const user = await signUp(app, 'Noa');

    const response = await server().get(`/api/v1/workspaces/${user.workspaceId}/products`);

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.headers['www-authenticate']).toBe(
      `Bearer resource_metadata="${PROTECTED_RESOURCE_METADATA}", ` +
        'scope="catalog:read catalog:write orders:read stores:write reports:read suggestions:write webhooks:write"',
    );
    expect(response.body).toEqual({ message: 'Unauthorized', statusCode: HttpStatus.UNAUTHORIZED });
  });

  it('says invalid_token when the token or key sent is refused', async () => {
    const user = await signUp(app, 'Omer');
    const path = `/api/v1/workspaces/${user.workspaceId}/products`;

    const withToken = await server().get(path).set('Authorization', 'Bearer not-a-token');
    const withKey = await server().get(path).set('x-api-key', 'cm_not_a_key');

    for (const response of [withToken, withKey]) {
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.headers['www-authenticate']).toMatch(
        new RegExp(
          `^Bearer error="invalid_token", resource_metadata="${PROTECTED_RESOURCE_METADATA}"`,
        ),
      );
    }
  });
});
