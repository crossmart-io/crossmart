import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER, SortDirection } from '@crossmart/common';
import { ActivityAction, InventorySort, StockAdjustmentMode, StockLevel } from '@crossmart/core';
import { InventoryMovementReason, PrismaService, WorkspaceRole } from '@crossmart/database';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

interface InventoryRowBody {
  inventoryItemId: string;
  productId: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  stockLevel: StockLevel;
}

describe('Inventory (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createCatalog({ cookie, workspaceId }: SignedUpUser): Promise<void> {
    const products = [
      {
        title: 'Stoneware Mug',
        optionNames: ['Color'],
        variants: [
          { sku: 'MUG-BLUE', optionValues: ['Blue'], price: '22', quantity: 30 },
          { sku: 'MUG-SAND', optionValues: ['Sand'], price: '22', quantity: 3 },
        ],
      },
      { title: 'Canvas Tote', variants: [{ sku: 'TOTE', price: '18', quantity: 0 }] },
      { title: 'Gift Card', variants: [{ sku: 'GIFT', price: '50', tracked: false }] },
    ];
    for (const product of products) {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/products`)
        .set('Cookie', cookie)
        .send(product);
      expect(response.status).toBe(HttpStatus.CREATED);
    }
  }

  async function listInventory(
    { cookie, workspaceId }: SignedUpUser,
    query: object = {},
  ): Promise<{ items: InventoryRowBody[]; nextCursor: string | null }> {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/inventory-items`)
      .query(query)
      .set('Cookie', cookie);
    expect(response.status).toBe(HttpStatus.OK);
    return response.body;
  }

  async function rowBySku(user: SignedUpUser, sku: string): Promise<InventoryRowBody> {
    const { items } = await listInventory(user, { search: sku });
    const row = items.find((item) => item.sku === sku);
    if (!row) throw new Error(`No inventory row for ${sku}`);
    return row;
  }

  function adjust(user: SignedUpUser, inventoryItemId: string, body: object) {
    return request(app.getHttpServer())
      .post(`/api/v1/workspaces/${user.workspaceId}/inventory-items/${inventoryItemId}/adjustments`)
      .set('Cookie', user.cookie)
      .send(body);
  }

  it('lists every variant in title order, pages, searches and filters by stock level', async () => {
    const seller = await signUp(app, 'Stock Keeper');
    await createCatalog(seller);

    const all = await listInventory(seller);
    expect(all.items.map((item) => item.sku)).toEqual(['TOTE', 'GIFT', 'MUG-BLUE', 'MUG-SAND']);

    const first = await listInventory(seller, { limit: 3 });
    const second = await listInventory(seller, { limit: 3, cursor: first.nextCursor });
    expect([...first.items, ...second.items].map((item) => item.sku)).toEqual(
      all.items.map((item) => item.sku),
    );
    expect(second.nextCursor).toBeNull();

    const byTitle = await listInventory(seller, { search: 'stoneware' });
    expect(byTitle.items).toHaveLength(2);
    const levels = await Promise.all(
      [StockLevel.LowStock, StockLevel.OutOfStock, StockLevel.Untracked].map(async (level) =>
        (await listInventory(seller, { stockLevel: level })).items.map((item) => item.sku),
      ),
    );
    expect(levels).toEqual([['MUG-SAND'], ['TOTE'], ['GIFT']]);
  });

  it('shows reserved units as part of the stock on hand', async () => {
    const seller = await signUp(app, 'Reserver');
    await createCatalog(seller);
    const blue = await rowBySku(seller, 'MUG-BLUE');
    await app.get(PrismaService).inventoryItem.update({
      where: { id: blue.inventoryItemId },
      data: { available: { decrement: 4 }, reserved: 4 },
    });

    expect(await rowBySku(seller, 'MUG-BLUE')).toMatchObject({
      onHand: 30,
      reserved: 4,
      available: 26,
    });
  });

  it('adjusts stock, records who did it and why, and lists the history newest first', async () => {
    const seller = await signUp(app, 'Adjuster');
    await createCatalog(seller);
    const sand = await rowBySku(seller, 'MUG-SAND');

    const received = await adjust(seller, sand.inventoryItemId, {
      mode: StockAdjustmentMode.Delta,
      quantity: 12,
      reason: InventoryMovementReason.RECEIVED,
      note: '  PO 1042 ',
    });
    expect(received.status).toBe(HttpStatus.OK);
    expect(received.body).toMatchObject({
      onHand: 15,
      available: 15,
      stockLevel: StockLevel.InStock,
    });

    const counted = await adjust(seller, sand.inventoryItemId, {
      mode: StockAdjustmentMode.Set,
      quantity: 14,
      reason: InventoryMovementReason.CORRECTION,
    });
    expect(counted.body.onHand).toBe(14);

    const history = await request(app.getHttpServer())
      .get(
        `/api/v1/workspaces/${seller.workspaceId}/inventory-items/${sand.inventoryItemId}/movements`,
      )
      .set('Cookie', seller.cookie);
    expect(history.body.items).toMatchObject([
      {
        delta: -1,
        reason: InventoryMovementReason.CORRECTION,
        quantityAfter: 14,
        userName: 'Adjuster',
      },
      { delta: 12, reason: InventoryMovementReason.RECEIVED, quantityAfter: 15, note: 'PO 1042' },
      {
        delta: 3,
        reason: InventoryMovementReason.OPENING_BALANCE,
        quantityAfter: 3,
        userName: null,
      },
    ]);
  });

  it('sorts stock by what is available and filters the history by reason, oldest first', async () => {
    const seller = await signUp(app, 'Sorter');
    await createCatalog(seller);
    const mostFirst = await listInventory(seller, {
      sort: InventorySort.Available,
      direction: SortDirection.Desc,
    });
    expect(mostFirst.items.map((item) => item.sku).slice(0, 3)).toEqual([
      'MUG-BLUE',
      'MUG-SAND',
      'TOTE',
    ]);
    const sand = await rowBySku(seller, 'MUG-SAND');
    for (const quantity of [5, 2]) {
      await adjust(seller, sand.inventoryItemId, {
        mode: StockAdjustmentMode.Delta,
        quantity,
        reason: InventoryMovementReason.RECEIVED,
      });
    }

    const received = await request(app.getHttpServer())
      .get(
        `/api/v1/workspaces/${seller.workspaceId}/inventory-items/${sand.inventoryItemId}/movements`,
      )
      .query({ reason: InventoryMovementReason.RECEIVED, direction: SortDirection.Asc })
      .set('Cookie', seller.cookie);
    expect(received.body.items.map((item: { delta: number }) => item.delta)).toEqual([5, 2]);
    expect(received.body.total).toBe(2);
  });

  function movementsOf(user: SignedUpUser, inventoryItemId: string) {
    return request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/inventory-items/${inventoryItemId}/movements`)
      .set('Cookie', user.cookie);
  }

  it('shows adjustments in the product’s activity and credits product edits in the ledger', async () => {
    const seller = await signUp(app, 'Stock Narrator');
    await createCatalog(seller);
    const sand = await rowBySku(seller, 'MUG-SAND');
    await adjust(seller, sand.inventoryItemId, {
      mode: StockAdjustmentMode.Delta,
      quantity: 12,
      reason: InventoryMovementReason.RECEIVED,
    });
    await adjust(seller, sand.inventoryItemId, {
      mode: StockAdjustmentMode.Set,
      quantity: 15,
      reason: InventoryMovementReason.CORRECTION,
    });

    const activity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${seller.workspaceId}/products/${sand.productId}/activity`)
      .set('Cookie', seller.cookie);
    expect(activity.body.items[0]).toMatchObject({
      action: ActivityAction.InventoryAdjusted,
      summary: 'Adjusted stock of “Stoneware Mug”: MUG-SAND +12, received',
      actor: { name: 'Stock Narrator' },
    });

    const productUrl = `/api/v1/workspaces/${seller.workspaceId}/products/${sand.productId}`;
    const product = await request(app.getHttpServer()).get(productUrl).set('Cookie', seller.cookie);
    const edited = await request(app.getHttpServer())
      .put(productUrl)
      .set('Cookie', seller.cookie)
      .send({
        handle: product.body.handle,
        title: product.body.title,
        optionNames: ['Color'],
        variants: product.body.variants.map((variant: { id: string; sku: string }) => ({
          id: variant.id,
          sku: variant.sku,
          optionValues: [variant.sku === 'MUG-SAND' ? 'Sand' : 'Blue'],
          price: '22',
          quantity: variant.sku === 'MUG-SAND' ? 10 : 30,
        })),
      });
    expect(edited.status).toBe(HttpStatus.OK);

    const history = await movementsOf(seller, sand.inventoryItemId);
    expect(history.body.items[0]).toMatchObject({
      delta: -5,
      reason: InventoryMovementReason.ADJUSTMENT,
      quantityAfter: 10,
      userName: 'Stock Narrator',
    });
  });

  it('refuses impossible adjustments and system reasons', async () => {
    const seller = await signUp(app, 'Careful Adjuster');
    await createCatalog(seller);
    const tote = await rowBySku(seller, 'TOTE');
    const gift = await rowBySku(seller, 'GIFT');
    const base = { mode: StockAdjustmentMode.Delta, reason: InventoryMovementReason.DAMAGED };

    const negative = await adjust(seller, tote.inventoryItemId, { ...base, quantity: -1 });
    const untracked = await adjust(seller, gift.inventoryItemId, { ...base, quantity: 1 });
    const systemReason = await adjust(seller, tote.inventoryItemId, {
      ...base,
      quantity: 1,
      reason: InventoryMovementReason.OPENING_BALANCE,
    });
    const fractional = await adjust(seller, tote.inventoryItemId, { ...base, quantity: 1.5 });

    expect(
      [negative, untracked, systemReason, fractional].map((response) => response.status),
    ).toEqual(Array(4).fill(HttpStatus.BAD_REQUEST));
  });

  it('attributes API key changes to the key and refuses read-only keys', async () => {
    const seller = await signUp(app, 'Key Owner');
    await createCatalog(seller);
    const blue = await rowBySku(seller, 'MUG-BLUE');
    const createKey = (role: WorkspaceRole) =>
      request(app.getHttpServer())
        .post(`/api/v1/workspaces/${seller.workspaceId}/api-keys`)
        .set('Cookie', seller.cookie)
        .send({ name: `${role} key`, role });
    const [editorKey, viewerKey] = await Promise.all([
      createKey(WorkspaceRole.EDITOR),
      createKey(WorkspaceRole.VIEWER),
    ]);
    const adjustmentsUrl = `/api/v1/workspaces/${seller.workspaceId}/inventory-items/${blue.inventoryItemId}/adjustments`;
    const body = {
      mode: StockAdjustmentMode.Delta,
      quantity: -2,
      reason: InventoryMovementReason.SOLD,
    };

    const viewer = await request(app.getHttpServer())
      .post(adjustmentsUrl)
      .set(API_KEY_HEADER, viewerKey.body.secret)
      .send(body);
    expect(viewer.status).toBe(HttpStatus.FORBIDDEN);

    const editor = await request(app.getHttpServer())
      .post(adjustmentsUrl)
      .set(API_KEY_HEADER, editorKey.body.secret)
      .send(body);
    expect(editor.body.onHand).toBe(28);
    const history = await request(app.getHttpServer())
      .get(
        `/api/v1/workspaces/${seller.workspaceId}/inventory-items/${blue.inventoryItemId}/movements`,
      )
      .set(API_KEY_HEADER, viewerKey.body.secret);
    expect(history.body.items[0]).toMatchObject({
      userName: null,
      apiKeyName: `${WorkspaceRole.EDITOR} key`,
    });
  });

  it('keeps one workspace’s stock out of another’s reach', async () => {
    const owner = await signUp(app, 'Stock Owner');
    const intruder = await signUp(app, 'Stock Intruder');
    await createCatalog(owner);
    const blue = await rowBySku(owner, 'MUG-BLUE');

    const foreignList = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/inventory-items`)
      .set('Cookie', intruder.cookie);
    expect(foreignList.status).toBe(HttpStatus.NOT_FOUND);
    expect((await listInventory(intruder)).items).toEqual([]);

    const foreignAdjust = await adjust(intruder, blue.inventoryItemId, {
      mode: StockAdjustmentMode.Set,
      quantity: 0,
      reason: InventoryMovementReason.LOST,
    });
    const foreignHistory = await request(app.getHttpServer())
      .get(
        `/api/v1/workspaces/${intruder.workspaceId}/inventory-items/${blue.inventoryItemId}/movements`,
      )
      .set('Cookie', intruder.cookie);
    expect([foreignAdjust.status, foreignHistory.status]).toEqual([
      HttpStatus.NOT_FOUND,
      HttpStatus.NOT_FOUND,
    ]);
    expect((await rowBySku(owner, 'MUG-BLUE')).onHand).toBe(30);
  });
});
