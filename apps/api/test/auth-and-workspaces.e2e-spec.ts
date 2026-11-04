import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { WorkspaceRole } from '@crossmart/database';
import { createTestApp, signUp as signUpUser, type SignedUpUser } from './support/test-app.js';

describe('Auth and workspaces (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function signUp(name: string): Promise<SignedUpUser> {
    return signUpUser(app, name);
  }

  it('rejects anonymous callers', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/me');

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('gives a new user a workspace they own', async () => {
    const { cookie, workspaceId } = await signUp('Dana Seller');

    const response = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Cookie', cookie);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      slug: 'default',
      currency: 'USD',
      role: WorkspaceRole.OWNER,
    });
  });

  it('hides a workspace from users who are not members', async () => {
    const owner = await signUp('Owner');
    const outsider = await signUp('Outsider');

    const response = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/members`)
      .set('Cookie', outsider.cookie);

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('issues an API key that works until it is revoked', async () => {
    const { cookie, workspaceId } = await signUp('Key Holder');
    const apiKeysUrl = `/api/v1/workspaces/${workspaceId}/api-keys`;

    const created = await request(app.getHttpServer())
      .post(apiKeysUrl)
      .set('Cookie', cookie)
      .send({ name: 'Claude Desktop', role: WorkspaceRole.EDITOR });
    expect(created.status).toBe(HttpStatus.CREATED);
    const { secret, apiKey } = created.body;

    const withKey = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set(API_KEY_HEADER, secret);
    expect(withKey.status).toBe(HttpStatus.OK);
    expect(withKey.body.role).toBe(WorkspaceRole.EDITOR);

    const editorManagingKeys = await request(app.getHttpServer())
      .get(apiKeysUrl)
      .set(API_KEY_HEADER, secret);
    expect(editorManagingKeys.status).toBe(HttpStatus.FORBIDDEN);

    const revoked = await request(app.getHttpServer())
      .delete(`${apiKeysUrl}/${apiKey.id}`)
      .set('Cookie', cookie);
    expect(revoked.status).toBe(HttpStatus.NO_CONTENT);

    const afterRevoke = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set(API_KEY_HEADER, secret);
    expect(afterRevoke.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('refuses to issue an owner key', async () => {
    const { cookie, workspaceId } = await signUp('Careful Owner');

    const response = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/api-keys`)
      .set('Cookie', cookie)
      .send({ name: 'root', role: WorkspaceRole.OWNER });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });
});
