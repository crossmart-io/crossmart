import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { WorkspaceRole } from '@crossmart/database';
import { ApiModule } from '../src/api.module.js';
import { configureApplication } from '../src/bootstrap/configure-application.js';

const PASSWORD = 'correct-horse-battery';
const SET_COOKIE_HEADER = 'set-cookie';

interface SignedUpUser {
  cookie: string;
  workspaceId: string;
}

describe('Auth and workspaces (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ApiModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function signUp(name: string): Promise<SignedUpUser> {
    const signUpResponse = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ name, email: `${randomUUID()}@example.com`, password: PASSWORD });
    expect(signUpResponse.status).toBe(HttpStatus.OK);
    const cookie = [signUpResponse.headers[SET_COOKIE_HEADER]].flat().join('; ');

    const meResponse = await request(app.getHttpServer()).get('/api/v1/me').set('Cookie', cookie);
    expect(meResponse.status).toBe(HttpStatus.OK);
    return { cookie, workspaceId: meResponse.body.workspaces[0].id };
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
    expect(response.body).toMatchObject({ slug: 'default', role: WorkspaceRole.OWNER });
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
