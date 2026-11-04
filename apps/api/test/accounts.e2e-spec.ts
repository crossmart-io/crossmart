import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import { PrismaService, WorkspaceRole } from '@crossmart/database';
import { answerGraphql, connectShopifyStore, newShop } from './support/shopify-store.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// The same fake app settings as `SHOPIFY_TEST_ENV`, set before the app module reads them.
vi.hoisted(() => {
  Object.assign(process.env, {
    SHOPIFY_CLIENT_ID: 'e2e-client-id',
    SHOPIFY_CLIENT_SECRET: 'e2e-client-secret',
    API_PUBLIC_URL: 'http://localhost:3006',
    WEB_APP_URL: 'http://localhost:5179',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const WORKSPACE_NAME = 'Default';

describe('Deleting workspaces and accounts (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const http = new FakeHttpTransport();

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(HttpTransport).useValue(http));
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    http.assertDone();
  });

  const server = () => app.getHttpServer();

  async function addProduct({ workspaceId, cookie }: SignedUpUser): Promise<void> {
    const created = await request(server())
      .post(`/api/v1/workspaces/${workspaceId}/products`)
      .set('Cookie', cookie)
      .send({
        title: 'Doomed Mug',
        variants: [{ sku: `DOOM-${Date.now()}`, price: '9', quantity: 3 }],
      });
    expect(created.status).toBe(HttpStatus.CREATED);
  }

  function deleteWorkspace({ workspaceId, cookie }: SignedUpUser, confirmName: string) {
    return request(server())
      .delete(`/api/v1/workspaces/${workspaceId}`)
      .set('Cookie', cookie)
      .send({ confirmName });
  }

  it('deletes a workspace with everything in it, removing the app from its store', async () => {
    const owner = await signUp(app, 'Closer');
    await addProduct(owner);
    const shop = newShop();
    await connectShopifyStore(app, http, owner, shop);

    expect((await deleteWorkspace(owner, 'Wrong name')).status).toBe(HttpStatus.BAD_REQUEST);
    const uninstalls: string[] = [];
    answerGraphql(http, shop, (call) => {
      uninstalls.push(call.query);
      return { data: { appUninstall: { userErrors: [] } } };
    });
    const deleted = await deleteWorkspace(owner, WORKSPACE_NAME);

    expect(deleted.status).toBe(HttpStatus.NO_CONTENT);
    expect(uninstalls[0]).toContain('appUninstall');
    const where = { workspaceId: owner.workspaceId };
    expect(await prisma.workspace.count({ where: { id: owner.workspaceId } })).toBe(0);
    expect(
      await Promise.all([
        prisma.product.count({ where }),
        prisma.inventoryItem.count({ where }),
        prisma.channelConnection.count({ where }),
        prisma.activityEvent.count({ where }),
      ]),
    ).toEqual([0, 0, 0, 0]);
  });

  it('lets only owners delete a workspace', async () => {
    const owner = await signUp(app, 'Keeper');
    const key = await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'admin key', role: WorkspaceRole.ADMIN });

    const refused = await request(server())
      .delete(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(API_KEY_HEADER, key.body.secret)
      .send({ confirmName: WORKSPACE_NAME });

    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    expect(await prisma.workspace.count({ where: { id: owner.workspaceId } })).toBe(1);
  });

  it('deletes an account with the workspaces only it uses, and signs it out', async () => {
    const user = await signUp(app, 'Leaving User');
    await addProduct(user);

    const deleted = await request(server()).delete('/api/v1/me').set('Cookie', user.cookie);

    expect(deleted.status).toBe(HttpStatus.NO_CONTENT);
    expect(await prisma.workspace.count({ where: { id: user.workspaceId } })).toBe(0);
    expect(await prisma.product.count({ where: { workspaceId: user.workspaceId } })).toBe(0);
    const after = await request(server()).get('/api/v1/me').set('Cookie', user.cookie);
    expect(after.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('refuses to delete an account that owns a workspace others use, and keeps theirs', async () => {
    const owner = await signUp(app, 'Team Owner');
    const teammate = await signUp(app, 'Teammate');
    const { id: teammateId } = await prisma.user.findFirstOrThrow({
      where: { memberships: { some: { workspaceId: teammate.workspaceId } } },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId: owner.workspaceId, userId: teammateId, role: WorkspaceRole.EDITOR },
    });

    const refused = await request(server()).delete('/api/v1/me').set('Cookie', owner.cookie);
    expect(refused.status).toBe(HttpStatus.CONFLICT);
    expect(refused.body.message).toContain(WORKSPACE_NAME);

    const left = await request(server()).delete('/api/v1/me').set('Cookie', teammate.cookie);
    expect(left.status).toBe(HttpStatus.NO_CONTENT);
    expect(await prisma.workspace.count({ where: { id: owner.workspaceId } })).toBe(1);
    expect(await prisma.workspace.count({ where: { id: teammate.workspaceId } })).toBe(0);
  });
});
