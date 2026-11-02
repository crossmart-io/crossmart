import { readFileSync } from 'node:fs';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { CatalogImportFormat, ImportIssueCode } from '@crossmart/core';
import { ProductStatus, WorkspaceRole } from '@crossmart/database';
import { createTestApp, signUp } from './support/test-app.js';

const SHOPIFY_EXPORT = readFileSync(
  new URL(
    '../../../libs/core/src/catalog/import/shopify-csv/__fixtures__/products.csv',
    import.meta.url,
  ),
);
const CSV_FILE_NAME = 'products_export.csv';

describe('Catalog (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function importShopifyCsv(workspaceId: string, cookie: string, file = SHOPIFY_EXPORT) {
    return request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/product-imports`)
      .set('Cookie', cookie)
      .field('format', CatalogImportFormat.ShopifyCsv)
      .attach('file', file, CSV_FILE_NAME);
  }

  it('imports a Shopify export once and skips it the second time', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Importer');

    const first = await importShopifyCsv(workspaceId, cookie);
    expect(first.status).toBe(HttpStatus.CREATED);
    expect(first.body).toMatchObject({ createdProducts: 8, createdVariants: 17, failed: [] });

    const second = await importShopifyCsv(workspaceId, cookie);
    expect(second.body.createdProducts).toBe(0);
    expect(second.body.skipped).toHaveLength(8);
    expect(second.body.skipped[0].code).toBe(ImportIssueCode.AlreadyExists);
  });

  it('lists, pages, filters and opens imported products', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Browser');
    await importShopifyCsv(workspaceId, cookie);
    const productsUrl = `/api/v1/workspaces/${workspaceId}/products`;

    const firstPage = await request(app.getHttpServer())
      .get(productsUrl)
      .query({ limit: 5 })
      .set('Cookie', cookie);
    expect(firstPage.body.items).toHaveLength(5);
    const secondPage = await request(app.getHttpServer())
      .get(productsUrl)
      .query({ limit: 5, cursor: firstPage.body.nextCursor })
      .set('Cookie', cookie);
    expect(secondPage.body.items).toHaveLength(3);
    expect(secondPage.body.nextCursor).toBeNull();

    const drafts = await request(app.getHttpServer())
      .get(productsUrl)
      .query({ status: ProductStatus.DRAFT })
      .set('Cookie', cookie);
    expect(drafts.body.items.map((item: { handle: string }) => item.handle)).toEqual([
      'beeswax-candle',
    ]);

    const bySku = await request(app.getHttpServer())
      .get(productsUrl)
      .query({ search: 'nf-mcs-l' })
      .set('Cookie', cookie);
    const [sweater] = bySku.body.items;
    expect(sweater).toMatchObject({
      handle: 'merino-crew-sweater',
      variantCount: 5,
      totalAvailable: 41,
      priceRange: { min: '89.00', max: '89.00' },
    });

    const detail = await request(app.getHttpServer())
      .get(`${productsUrl}/${sweater.id}`)
      .set('Cookie', cookie);
    expect(detail.body.optionNames).toEqual(['Size', 'Color']);
    expect(detail.body.variants[0]).toMatchObject({ sku: 'NF-MCS-S-CHR', available: 12 });
  });

  it('keeps one workspace’s catalog invisible to another', async () => {
    const owner = await signUp(app, 'Owner');
    const outsider = await signUp(app, 'Outsider');
    await importShopifyCsv(owner.workspaceId, owner.cookie);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', outsider.cookie);

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('creates and deletes a product through the API, and refuses read-only keys', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Creator');
    const productsUrl = `/api/v1/workspaces/${workspaceId}/products`;
    const product = {
      title: 'Café Crème Mug',
      variants: [{ sku: 'MUG-1', price: '18.5', quantity: 4 }],
    };

    const created = await request(app.getHttpServer())
      .post(productsUrl)
      .set('Cookie', cookie)
      .send(product);
    expect(created.status).toBe(HttpStatus.CREATED);
    expect(created.body).toMatchObject({ handle: 'cafe-creme-mug', status: ProductStatus.DRAFT });
    expect(created.body.variants[0]).toMatchObject({ price: '18.50', available: 4 });

    const duplicate = await request(app.getHttpServer())
      .post(productsUrl)
      .set('Cookie', cookie)
      .send(product);
    expect(duplicate.status).toBe(HttpStatus.CONFLICT);

    const viewerKey = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/api-keys`)
      .set('Cookie', cookie)
      .send({ name: 'Read only', role: WorkspaceRole.VIEWER });
    const viewerDelete = await request(app.getHttpServer())
      .delete(`${productsUrl}/${created.body.id}`)
      .set(API_KEY_HEADER, viewerKey.body.secret);
    expect(viewerDelete.status).toBe(HttpStatus.FORBIDDEN);

    const deleted = await request(app.getHttpServer())
      .delete(`${productsUrl}/${created.body.id}`)
      .set('Cookie', cookie);
    expect(deleted.status).toBe(HttpStatus.NO_CONTENT);
  });

  it('rejects a file that is not a Shopify export', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Wrong File');

    const response = await importShopifyCsv(workspaceId, cookie, Buffer.from('sku,price\nA,1\n'));

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('edits a product: keeps variant ids, adds and removes variants, adjusts stock', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Editor');
    const productsUrl = `/api/v1/workspaces/${workspaceId}/products`;
    const created = await request(app.getHttpServer())
      .post(productsUrl)
      .set('Cookie', cookie)
      .send({
        title: 'Linen Shirt',
        optionNames: ['Size'],
        variants: [
          { sku: 'LS-S', optionValues: ['S'], price: '60', quantity: 5 },
          { sku: 'LS-M', optionValues: ['M'], price: '60', quantity: 5 },
        ],
      });
    const [small, medium] = created.body.variants;

    const updated = await request(app.getHttpServer())
      .put(`${productsUrl}/${created.body.id}`)
      .set('Cookie', cookie)
      .send({
        handle: created.body.handle,
        title: 'Linen Shirt',
        descriptionHtml: '<p>Breezy</p><script>alert(1)</script>',
        status: ProductStatus.ACTIVE,
        optionNames: ['Size'],
        variants: [
          { id: small.id, sku: 'LS-S', optionValues: ['S'], price: '55', quantity: 2 },
          { sku: 'LS-L', optionValues: ['L'], price: '60', quantity: 7 },
        ],
      });

    expect(updated.status).toBe(HttpStatus.OK);
    expect(updated.body.descriptionHtml).toBe('<p>Breezy</p>');
    expect(updated.body.variants.map((variant: { sku: string }) => variant.sku)).toEqual([
      'LS-S',
      'LS-L',
    ]);
    expect(updated.body.variants[0]).toMatchObject({ id: small.id, price: '55.00', available: 2 });
    expect(updated.body.variants.some((variant: { id: string }) => variant.id === medium.id)).toBe(
      false,
    );
  });

  it('uploads a product image and serves it to other origins', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Photographer');
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

    const uploaded = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/media/product-images`)
      .set('Cookie', cookie)
      .attach('file', png, 'photo.png');
    expect(uploaded.status).toBe(HttpStatus.CREATED);
    expect(uploaded.body.contentType).toBe('image/png');

    const served = await request(app.getHttpServer()).get(new URL(uploaded.body.url).pathname);
    expect(served.status).toBe(HttpStatus.OK);
    expect(served.headers['cross-origin-resource-policy']).toBe('cross-origin');

    const svg = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/media/product-images`)
      .set('Cookie', cookie)
      .attach('file', Buffer.from('<svg onload="alert(1)"/>'), 'evil.png');
    expect(svg.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('counts the catalog for the overview', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Counter');
    await importShopifyCsv(workspaceId, cookie);

    const stats = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/catalog-stats`)
      .set('Cookie', cookie);

    expect(stats.body).toEqual({
      products: 8,
      activeProducts: 7,
      draftProducts: 1,
      archivedProducts: 0,
      variants: 17,
      outOfStockVariants: 2,
    });
  });
});
