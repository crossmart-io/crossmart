import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  ActivityAction,
  ActivitySubjectType,
  BulkProductAction,
  CatalogImportFormat,
} from '@crossmart/core';
import {
  ActivityActorType,
  ActivityOutcome,
  ProductStatus,
  WorkspaceRole,
} from '@crossmart/database';
import { createTestApp, type SignedUpUser, signUp } from './support/test-app.js';

interface ActivityEventBody {
  id: string;
  action: ActivityAction;
  outcome: ActivityOutcome;
  summary: string;
  actor: { type: ActivityActorType; name: string | null };
  subject: { type: ActivitySubjectType; id: string | null; label: string | null } | null;
  failureReason: string | null;
}

describe('Activity (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function server() {
    return request(app.getHttpServer());
  }

  async function createProduct({ cookie, workspaceId }: SignedUpUser, title: string) {
    const response = await server()
      .post(`/api/v1/workspaces/${workspaceId}/products`)
      .set('Cookie', cookie)
      .send({ title, variants: [{ price: '10' }] });
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body as { id: string; handle: string };
  }

  async function activityOf({ cookie, workspaceId }: SignedUpUser, query: object = {}) {
    const response = await server()
      .get(`/api/v1/workspaces/${workspaceId}/activity`)
      .query(query)
      .set('Cookie', cookie);
    expect(response.status).toBe(HttpStatus.OK);
    return response.body as { items: ActivityEventBody[]; nextCursor: string | null };
  }

  it('records a product update with who made it, in the log and the product history', async () => {
    const user = await signUp(app, 'Dana Editor');
    const product = await createProduct(user, 'Linen Shirt');

    const updated = await server()
      .put(`/api/v1/workspaces/${user.workspaceId}/products/${product.id}`)
      .set('Cookie', user.cookie)
      .send({
        handle: product.handle,
        title: 'Linen Shirt II',
        status: ProductStatus.ACTIVE,
        variants: [{ price: '12' }],
      });
    expect(updated.status).toBe(HttpStatus.OK);

    const { items } = await activityOf(user);
    expect(items.map((event) => event.action)).toEqual([
      ActivityAction.ProductUpdated,
      ActivityAction.ProductCreated,
    ]);
    expect(items[0]).toMatchObject({
      outcome: ActivityOutcome.SUCCEEDED,
      summary: 'Updated product “Linen Shirt II”',
      actor: { type: ActivityActorType.USER, name: 'Dana Editor' },
      subject: { type: ActivitySubjectType.Product, id: product.id, label: 'Linen Shirt II' },
    });

    const history = await server()
      .get(`/api/v1/workspaces/${user.workspaceId}/products/${product.id}/activity`)
      .set('Cookie', user.cookie);
    expect(history.body.items).toHaveLength(2);
  });

  it('credits the API key that made a change, and logs key creation and revocation', async () => {
    const user = await signUp(app, 'Key Owner');
    const key = await server()
      .post(`/api/v1/workspaces/${user.workspaceId}/api-keys`)
      .set('Cookie', user.cookie)
      .send({ name: 'Catalog agent', role: WorkspaceRole.EDITOR });

    await server()
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set(API_KEY_HEADER, key.body.secret)
      .send({ title: 'Agent Mug', variants: [{ price: '9' }] });
    await server()
      .delete(`/api/v1/workspaces/${user.workspaceId}/api-keys/${key.body.apiKey.id}`)
      .set('Cookie', user.cookie);

    const { items } = await activityOf(user);
    expect(items.map((event) => [event.action, event.actor.type, event.actor.name])).toEqual([
      [ActivityAction.ApiKeyRevoked, ActivityActorType.USER, 'Key Owner'],
      [ActivityAction.ProductCreated, ActivityActorType.API_KEY, 'Catalog agent'],
      [ActivityAction.ApiKeyCreated, ActivityActorType.USER, 'Key Owner'],
    ]);
    expect(JSON.stringify(items)).not.toContain(key.body.secret);
  });

  it('shows bulk actions in each product’s history and logs failed imports', async () => {
    const user = await signUp(app, 'Bulk Logger');
    const mug = await createProduct(user, 'Mug');
    const cup = await createProduct(user, 'Cup');

    await server()
      .post(`/api/v1/workspaces/${user.workspaceId}/product-bulk-actions`)
      .set('Cookie', user.cookie)
      .send({ productIds: [mug.id, cup.id], action: BulkProductAction.AdjustPrices, percent: 10 });
    const badImport = await server()
      .post(`/api/v1/workspaces/${user.workspaceId}/product-imports`)
      .set('Cookie', user.cookie)
      .field('format', CatalogImportFormat.ShopifyCsv)
      .attach('file', Buffer.from('sku,price\nA,1\n'), 'products.csv');
    expect(badImport.status).toBe(HttpStatus.BAD_REQUEST);

    const cupHistory = await server()
      .get(`/api/v1/workspaces/${user.workspaceId}/products/${cup.id}/activity`)
      .set('Cookie', user.cookie);
    expect(cupHistory.body.items[0]).toMatchObject({
      action: ActivityAction.ProductsBulkUpdated,
      itemCount: 2,
      summary: 'Bulk edited 2 products: prices +10%',
    });

    const failures = await activityOf(user, { outcome: ActivityOutcome.FAILED });
    expect(failures.items).toHaveLength(1);
    expect(failures.items[0]).toMatchObject({
      action: ActivityAction.ProductsImported,
      summary: 'Product import failed',
    });
    expect(failures.items[0]?.failureReason).toBeTruthy();
  });

  it('pages newest first and filters by action', async () => {
    const user = await signUp(app, 'Pager');
    for (const title of ['One', 'Two', 'Three']) {
      await createProduct(user, title);
    }

    const first = await activityOf(user, { limit: 2 });
    const second = await activityOf(user, { limit: 2, cursor: first.nextCursor });
    const labels = [...first.items, ...second.items].map((event) => event.subject?.label);
    expect(labels).toEqual(['Three', 'Two', 'One']);
    expect(second.nextCursor).toBeNull();

    const deletes = await activityOf(user, { action: ActivityAction.ProductDeleted });
    expect(deletes.items).toHaveLength(0);
    const invalid = await server()
      .get(`/api/v1/workspaces/${user.workspaceId}/activity`)
      .query({ action: 'dropped_tables' })
      .set('Cookie', user.cookie);
    expect(invalid.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('keeps one workspace’s activity invisible to another', async () => {
    const owner = await signUp(app, 'Activity Owner');
    const outsider = await signUp(app, 'Activity Outsider');
    const product = await createProduct(owner, 'Private Mug');

    const foreignLog = await server()
      .get(`/api/v1/workspaces/${owner.workspaceId}/activity`)
      .set('Cookie', outsider.cookie);
    expect(foreignLog.status).toBe(HttpStatus.NOT_FOUND);

    const probe = await server()
      .get(`/api/v1/workspaces/${outsider.workspaceId}/products/${product.id}/activity`)
      .set('Cookie', outsider.cookie);
    expect(probe.status).toBe(HttpStatus.OK);
    expect(probe.body.items).toEqual([]);
    expect((await activityOf(outsider)).items).toEqual([]);
  });
});
