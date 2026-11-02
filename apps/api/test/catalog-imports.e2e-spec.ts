import { readFileSync } from 'node:fs';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  ActivityAction,
  ActivitySubjectType,
  CatalogImportFormat,
  CatalogImportMode,
  ImportIssueCode,
} from '@crossmart/core';
import {
  ImportIssueOutcome,
  ImportJobStatus,
  InventoryMovementReason,
  WorkspaceRole,
} from '@crossmart/database';
import { createTestApp, type SignedUpUser, signUp } from './support/test-app.js';

const SHOPIFY_EXPORT = readFileSync(
  new URL(
    '../../../libs/core/src/catalog/import/shopify-csv/__fixtures__/products.csv',
    import.meta.url,
  ),
);
const SHOPIFY_UPDATE_HEADER =
  'Handle,Title,Status,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Tracker,Variant Inventory Qty';

interface ImportRequest {
  mode?: CatalogImportMode;
  format: CatalogImportFormat;
  content: Buffer;
  fileName?: string;
}

describe('Catalog imports and history (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function upload(user: SignedUpUser, file: ImportRequest, apiKey?: string) {
    const call = request(app.getHttpServer()).post(
      `/api/v1/workspaces/${user.workspaceId}/product-imports`,
    );
    const authenticated = apiKey
      ? call.set(API_KEY_HEADER, apiKey)
      : call.set('Cookie', user.cookie);
    const withMode = file.mode ? authenticated.field('mode', file.mode) : authenticated;
    return withMode
      .field('format', file.format)
      .attach('file', file.content, file.fileName ?? 'catalog.csv');
  }

  function importShopify(user: SignedUpUser) {
    return upload(user, { format: CatalogImportFormat.ShopifyCsv, content: SHOPIFY_EXPORT });
  }

  function inventoryCsv(...rows: string[]): Buffer {
    return Buffer.from(['sku,available', ...rows].join('\n'));
  }

  function getProduct(user: SignedUpUser, handle: string) {
    return request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/products`)
      .query({ search: handle })
      .set('Cookie', user.cookie)
      .then((list) =>
        request(app.getHttpServer())
          .get(`/api/v1/workspaces/${user.workspaceId}/products/${list.body.items[0].id}`)
          .set('Cookie', user.cookie),
      );
  }

  function history(user: SignedUpUser, query: Record<string, string | number> = {}) {
    return request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/import-jobs`)
      .query(query)
      .set('Cookie', user.cookie);
  }

  it('updates existing products by handle, keeping variant ids and stock', async () => {
    const user = await signUp(app, 'Updater');
    await importShopify(user);
    const before = (await getProduct(user, 'stoneware-mug')).body;
    const moss = before.variants.find((variant: { sku: string }) => variant.sku === 'HCS-SSM-MOS');

    const updated = await upload(user, {
      mode: CatalogImportMode.Update,
      format: CatalogImportFormat.ShopifyCsv,
      content: Buffer.from(
        [
          SHOPIFY_UPDATE_HEADER,
          'stoneware-mug,Stoneware Mug XL,active,Glaze,Moss,HCS-SSM-MOS,30.00,shopify,999',
          'not-in-catalog,Lamp,active,,,LAMP-1,10.00,shopify,1',
        ].join('\n'),
      ),
    });

    expect(updated.status).toBe(HttpStatus.CREATED);
    expect(updated.body).toMatchObject({
      mode: CatalogImportMode.Update,
      updatedProducts: 1,
      createdProducts: 0,
      failed: [],
      skipped: [expect.objectContaining({ code: ImportIssueCode.NotFound, row: 3 })],
    });
    const after = (await getProduct(user, 'stoneware-mug')).body;
    expect(after.title).toBe('Stoneware Mug XL');
    expect(after.optionNames).toEqual(['Glaze']);
    expect(after.variants).toEqual(
      before.variants.map((variant: { id: string }) =>
        variant.id === moss.id
          ? { ...variant, price: '30.00' }
          : expect.objectContaining({ id: variant.id }),
      ),
    );
    expect(after.media.length).toBe(before.media.length);

    const workspaceActivity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/activity`)
      .set('Cookie', user.cookie);
    expect(workspaceActivity.body.items.map((event: { summary: string }) => event.summary)).toEqual(
      [
        'Updated 1 product from “catalog.csv”: 1 skipped',
        expect.stringMatching(/^Imported \d+ products from “catalog.csv”/),
      ],
    );
    const mugActivity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/products/${after.id}/activity`)
      .set('Cookie', user.cookie);
    expect(mugActivity.body.items.map((event: { action: string }) => event.action)).toEqual([
      ActivityAction.ProductsUpdatedByImport,
      ActivityAction.ProductsImported,
    ]);
  });

  it('changes only the columns of an update file and never deletes variants', async () => {
    const user = await signUp(app, 'Partial updater');
    await importShopify(user);
    const before = (await getProduct(user, 'stoneware-mug')).body;

    const updated = await upload(user, {
      mode: CatalogImportMode.Update,
      format: CatalogImportFormat.ShopifyCsv,
      content: Buffer.from(
        [
          'Handle,Title,Status,Variant SKU,Variant Price',
          'stoneware-mug,Speckled Stoneware Mug,active,HCS-SSM-OAT,25.00',
          'stoneware-mug,,,NOT-A-MUG-SKU,9.00',
        ].join('\n'),
      ),
    });

    expect(updated.body).toMatchObject({
      updatedProducts: 1,
      skipped: [],
      failed: [
        expect.objectContaining({
          code: ImportIssueCode.UnmatchedVariant,
          sku: 'NOT-A-MUG-SKU',
          row: 3,
        }),
      ],
    });
    const after = (await getProduct(user, 'stoneware-mug')).body;
    const { title, descriptionHtml, vendor, productType, tags, status, optionNames } = before;
    expect(after).toMatchObject({
      title,
      descriptionHtml,
      vendor,
      productType,
      tags,
      status,
      optionNames,
    });
    expect(after.media.map((media: { url: string }) => media.url)).toEqual(
      before.media.map((media: { url: string }) => media.url),
    );
    expect(after.variants).toEqual(
      before.variants.map((variant: { sku: string }) =>
        variant.sku === 'HCS-SSM-OAT' ? { ...variant, price: '25.00' } : variant,
      ),
    );
  });

  it('sets stock by SKU and reports each row it could not apply', async () => {
    const user = await signUp(app, 'Stocker');
    await importShopify(user);
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set('Cookie', user.cookie)
      .send({ title: 'Gift card', variants: [{ sku: 'GIFT-1', price: '25', tracked: false }] });

    const response = await upload(user, {
      mode: CatalogImportMode.Inventory,
      format: CatalogImportFormat.InventoryCsv,
      content: inventoryCsv('HCS-SSM-MOS,42', 'GIFT-1,5', 'NOPE-1,3', 'HCS-SSM-OAT,lots'),
      fileName: 'stock-מלאי.csv',
    });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject({ mode: CatalogImportMode.Inventory, updatedVariants: 1 });
    expect(response.body.skipped).toEqual([
      expect.objectContaining({ code: ImportIssueCode.NotTracked, sku: 'GIFT-1', row: 3 }),
    ]);
    expect(
      response.body.failed.map((issue: { code: string; row: number }) => [issue.row, issue.code]),
    ).toEqual([
      [4, ImportIssueCode.UnknownSku],
      [5, ImportIssueCode.InvalidValue],
    ]);
    const mug = (await getProduct(user, 'stoneware-mug')).body;
    expect(
      mug.variants.find((variant: { sku: string }) => variant.sku === 'HCS-SSM-MOS').available,
    ).toBe(42);
    const stock = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/inventory-items`)
      .query({ search: 'HCS-SSM-MOS' })
      .set('Cookie', user.cookie);
    const ledger = await request(app.getHttpServer())
      .get(
        `/api/v1/workspaces/${user.workspaceId}/inventory-items/${stock.body.items[0].inventoryItemId}/movements`,
      )
      .set('Cookie', user.cookie);
    expect(ledger.body.items[0]).toMatchObject({
      reason: InventoryMovementReason.IMPORTED,
      quantityAfter: 42,
      userName: 'Stocker',
    });
    const productActivity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/products/${mug.id}/activity`)
      .set('Cookie', user.cookie);
    expect(productActivity.body.items[0]).toMatchObject({
      action: ActivityAction.StockImported,
      summary: 'Set stock of 1 variant from “stock-מלאי.csv”: 1 skipped, 2 failed',
      subject: { type: ActivitySubjectType.ImportJob, id: response.body.jobId },
      itemCount: 1,
      actor: { name: 'Stocker' },
    });

    const job = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/import-jobs/${response.body.jobId}`)
      .set('Cookie', user.cookie);
    expect(job.status).toBe(HttpStatus.OK);
    expect(job.body).toMatchObject({
      status: ImportJobStatus.COMPLETED,
      mode: CatalogImportMode.Inventory,
      fileName: 'stock-מלאי.csv',
      counts: { created: 0, updated: 1, skipped: 1, failed: 2 },
      actor: { userName: 'Stocker', apiKeyId: null },
    });
    expect(
      job.body.issues.map((issue: { row: number; outcome: string }) => [issue.row, issue.outcome]),
    ).toEqual([
      [3, ImportIssueOutcome.SKIPPED],
      [4, ImportIssueOutcome.FAILED],
      [5, ImportIssueOutcome.FAILED],
    ]);
  });

  it('refuses a mode that cannot read the format, without recording it', async () => {
    const user = await signUp(app, 'Mismatch');

    const response = await upload(user, {
      mode: CatalogImportMode.Inventory,
      format: CatalogImportFormat.ShopifyCsv,
      content: inventoryCsv('A,1'),
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect((await history(user)).body.items).toEqual([]);
  });

  it('lists the history newest first, in pages, including rejected files', async () => {
    const user = await signUp(app, 'Historian');
    await importShopify(user);
    const rejected = await upload(user, {
      mode: CatalogImportMode.Inventory,
      format: CatalogImportFormat.InventoryCsv,
      content: Buffer.from('Handle,Title\nmug,Mug'),
      fileName: 'wrong.csv',
    });
    expect(rejected.status).toBe(HttpStatus.BAD_REQUEST);

    const firstPage = await history(user, { limit: 1 });
    expect(firstPage.status).toBe(HttpStatus.OK);
    expect(firstPage.body.items).toEqual([
      expect.objectContaining({
        fileName: 'wrong.csv',
        status: ImportJobStatus.FAILED,
        errorMessage: expect.stringContaining('missing sku, available'),
      }),
    ]);
    const secondPage = await history(user, { limit: 1, cursor: firstPage.body.nextCursor });
    expect(secondPage.body.items).toEqual([
      expect.objectContaining({
        mode: CatalogImportMode.Create,
        status: ImportJobStatus.COMPLETED,
        counts: { created: 8, updated: 0, skipped: 0, failed: 0 },
      }),
    ]);
    expect(secondPage.body.nextCursor).toBeNull();
  });

  it('attributes key imports to the key and keeps history private to the workspace', async () => {
    const owner = await signUp(app, 'Owner');
    const outsider = await signUp(app, 'Outsider');
    const editorKey = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Stock sync', role: WorkspaceRole.EDITOR });
    const imported = await upload(
      owner,
      { format: CatalogImportFormat.ShopifyCsv, content: SHOPIFY_EXPORT },
      editorKey.body.secret,
    );
    expect(imported.status).toBe(HttpStatus.CREATED);
    const jobUrl = `/api/v1/workspaces/${owner.workspaceId}/import-jobs/${imported.body.jobId}`;

    const asOwner = await request(app.getHttpServer()).get(jobUrl).set('Cookie', owner.cookie);
    expect(asOwner.body.actor).toMatchObject({ userName: null, apiKeyName: 'Stock sync' });

    const outsiderJob = await request(app.getHttpServer())
      .get(jobUrl)
      .set('Cookie', outsider.cookie);
    expect(outsiderJob.status).toBe(HttpStatus.NOT_FOUND);
    const foreignJob = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${outsider.workspaceId}/import-jobs/${imported.body.jobId}`)
      .set('Cookie', outsider.cookie);
    expect(foreignJob.status).toBe(HttpStatus.NOT_FOUND);
    expect((await history(outsider)).body.items).toEqual([]);
  });

  it('lets read-only keys see the history but not import', async () => {
    const owner = await signUp(app, 'Reader');
    const viewerKey = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Read only', role: WorkspaceRole.VIEWER });

    const refused = await upload(
      owner,
      {
        format: CatalogImportFormat.InventoryCsv,
        mode: CatalogImportMode.Inventory,
        content: inventoryCsv(),
      },
      viewerKey.body.secret,
    );
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);

    const listed = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/import-jobs`)
      .set(API_KEY_HEADER, viewerKey.body.secret);
    expect(listed.status).toBe(HttpStatus.OK);
  });
});
