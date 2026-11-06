import { readFileSync } from 'node:fs';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  BulkProductAction,
  CatalogGap,
  CatalogImportFormat,
  ImportIssueCode,
} from '@crossmart/core';
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
    expect(firstPage.body.total).toBe(8);

    // Page numbers, as tables use them, land on the same rows as the cursor.
    const pageTwo = await request(app.getHttpServer())
      .get(productsUrl)
      .query({ limit: 5, page: 2 })
      .set('Cookie', cookie);
    expect(pageTwo.body.items).toEqual(secondPage.body.items);
    expect(pageTwo.body).toMatchObject({ total: 8, nextCursor: null });
    const badPage = await request(app.getHttpServer())
      .get(productsUrl)
      .query({ page: 0 })
      .set('Cookie', cookie);
    expect(badPage.status).toBe(HttpStatus.BAD_REQUEST);

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

  it('keeps a variant’s stock when an edit leaves its quantity out', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Stock Keeper');
    const productsUrl = `/api/v1/workspaces/${workspaceId}/products`;
    const created = await request(app.getHttpServer())
      .post(productsUrl)
      .set('Cookie', cookie)
      .send({
        title: 'Wool Socks',
        optionNames: ['Size'],
        variants: [{ sku: 'WS-1', optionValues: ['M'], price: '12', quantity: 9 }],
      });
    const [variant] = created.body.variants;

    const updated = await request(app.getHttpServer())
      .put(`${productsUrl}/${created.body.id}`)
      .set('Cookie', cookie)
      .send({
        handle: created.body.handle,
        title: 'Wool Socks',
        optionNames: ['Size'],
        variants: [
          { id: variant.id, sku: 'WS-1', optionValues: ['M'], price: '14' },
          { sku: 'WS-2', optionValues: ['L'], price: '14' },
        ],
      });

    expect(updated.status).toBe(HttpStatus.OK);
    expect(updated.body.variants[0]).toMatchObject({
      id: variant.id,
      price: '14.00',
      available: 9,
    });
    expect(updated.body.variants[1]).toMatchObject({ sku: 'WS-2', available: 0 });
  });

  it('gives a product with a non-Latin title a stable handle of its own', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Hebrew Titles');
    const productsUrl = `/api/v1/workspaces/${workspaceId}/products`;
    const product = { title: 'צמיד כסף בעבודת יד', variants: [{ price: '120' }] };

    const first = await request(app.getHttpServer())
      .post(productsUrl)
      .set('Cookie', cookie)
      .send(product);
    const second = await request(app.getHttpServer())
      .post(productsUrl)
      .set('Cookie', cookie)
      .send(product);

    expect(first.status).toBe(HttpStatus.CREATED);
    expect(second.status).toBe(HttpStatus.CREATED);
    expect(first.body.title).toBe(product.title);
    expect(first.body.handle).toMatch(/^product-[0-9a-f]{12}$/);
    expect(second.body.handle).not.toBe(first.body.handle);
  });

  it('refuses a title longer than channels accept', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Long Titles');

    const response = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/products`)
      .set('Cookie', cookie)
      .send({ title: 'x'.repeat(256), variants: [{ price: '1' }] });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
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

    const product = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/products`)
      .set('Cookie', cookie)
      .send({
        title: 'Photographed Mug',
        media: [{ url: uploaded.body.url, altText: 'A mug' }],
        variants: [{ price: '12' }],
      });
    expect(product.status).toBe(HttpStatus.CREATED);
    expect(product.body.media[0]).toMatchObject({ url: uploaded.body.url, altText: 'A mug' });

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
      gaps: [
        { gap: CatalogGap.Images, products: 8 },
        { gap: CatalogGap.Description, products: 0 },
        { gap: CatalogGap.Sku, products: 0 },
        { gap: CatalogGap.Barcode, products: 8 },
        { gap: CatalogGap.OutOfStock, products: 2 },
      ],
    });
  });

  it('lists only the products that have a gap', async () => {
    const { cookie, workspaceId } = await signUp(app, 'Gap Finder');
    await importShopifyCsv(workspaceId, cookie);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/products`)
      .query({ gap: CatalogGap.OutOfStock })
      .set('Cookie', cookie);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.items.map((product: { handle: string }) => product.handle)).toEqual([
      'merino-crew-sweater',
      'stoneware-mug',
    ]);
  });

  describe('bulk actions and saved views', () => {
    async function catalogOf(workspaceId: string, cookie: string) {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/products`)
        .query({ limit: 100 })
        .set('Cookie', cookie);
      return response.body.items as {
        id: string;
        handle: string;
        status: ProductStatus;
        priceRange: { min: string };
      }[];
    }

    function bulk(workspaceId: string, cookie: string, body: object) {
      return request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/product-bulk-actions`)
        .set('Cookie', cookie)
        .send(body);
    }

    it('changes status, tags and prices of the selected products only', async () => {
      const { cookie, workspaceId } = await signUp(app, 'Bulk Editor');
      await importShopifyCsv(workspaceId, cookie);
      const products = await catalogOf(workspaceId, cookie);
      const mug = products.find((product) => product.handle === 'stoneware-mug')!;
      const tote = products.find((product) => product.handle === 'canvas-tote-bag')!;
      const selection = [mug.id, tote.id];

      const archived = await bulk(workspaceId, cookie, {
        productIds: selection,
        action: BulkProductAction.SetStatus,
        status: ProductStatus.ARCHIVED,
      });
      expect(archived.body).toEqual({ affected: 2 });

      await bulk(workspaceId, cookie, {
        productIds: selection,
        action: BulkProductAction.AddTags,
        tags: ['Sale', 'kitchen'],
      });
      await bulk(workspaceId, cookie, {
        productIds: selection,
        action: BulkProductAction.RemoveTags,
        tags: ['SALE'],
      });
      await bulk(workspaceId, cookie, {
        productIds: [mug.id],
        action: BulkProductAction.AdjustPrices,
        percent: -10,
      });

      const after = await catalogOf(workspaceId, cookie);
      expect(after.filter((product) => product.status === ProductStatus.ARCHIVED)).toHaveLength(2);
      expect(after.find((product) => product.id === mug.id)?.priceRange.min).toBe('19.80');
      const detail = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/products/${tote.id}`)
        .set('Cookie', cookie);
      expect(detail.body.tags).toContain('kitchen');
      expect(detail.body.tags).not.toContain('Sale');
    });

    it('leaves other workspaces alone and rejects an action without its field', async () => {
      const owner = await signUp(app, 'Bulk Owner');
      const intruder = await signUp(app, 'Bulk Intruder');
      await importShopifyCsv(owner.workspaceId, owner.cookie);
      const [first] = await catalogOf(owner.workspaceId, owner.cookie);

      const foreign = await bulk(intruder.workspaceId, intruder.cookie, {
        productIds: [first!.id],
        action: BulkProductAction.Delete,
      });
      expect(foreign.body).toEqual({ affected: 0 });
      expect(await catalogOf(owner.workspaceId, owner.cookie)).toHaveLength(8);

      const missingStatus = await bulk(owner.workspaceId, owner.cookie, {
        productIds: [first!.id],
        action: BulkProductAction.SetStatus,
      });
      expect(missingStatus.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('saves, lists and deletes a view, refusing a duplicate name', async () => {
      const { cookie, workspaceId } = await signUp(app, 'View Keeper');
      const viewsUrl = `/api/v1/workspaces/${workspaceId}/product-views`;

      const created = await request(app.getHttpServer())
        .post(viewsUrl)
        .set('Cookie', cookie)
        .send({ name: 'Drafts to finish', status: ProductStatus.DRAFT, gap: CatalogGap.Images });
      expect(created.status).toBe(HttpStatus.CREATED);
      expect(created.body).toMatchObject({
        name: 'Drafts to finish',
        search: null,
        gap: CatalogGap.Images,
      });

      const duplicate = await request(app.getHttpServer())
        .post(viewsUrl)
        .set('Cookie', cookie)
        .send({ name: 'drafts to finish' });
      expect(duplicate.status).toBe(HttpStatus.CONFLICT);

      const listed = await request(app.getHttpServer()).get(viewsUrl).set('Cookie', cookie);
      expect(listed.body).toHaveLength(1);

      const deleted = await request(app.getHttpServer())
        .delete(`${viewsUrl}/${created.body.id}`)
        .set('Cookie', cookie);
      expect(deleted.status).toBe(HttpStatus.NO_CONTENT);
    });
  });
});
