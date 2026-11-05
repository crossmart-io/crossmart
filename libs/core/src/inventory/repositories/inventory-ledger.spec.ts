import { InventoryMovementReason, Prisma } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type { LockedStock, StockMovement } from '../entities/inventory-ledger.js';
import { InventoryLedger } from './inventory-ledger.js';

const WORKSPACE_ID = '00000000-0000-4000-8000-000000000001';
const ITEM_A = '00000000-0000-4000-8000-00000000000a';
const ITEM_B = '00000000-0000-4000-8000-00000000000b';

interface RecordedQuery {
  sql: string;
  values: unknown[];
}

function fakeTransaction(lockedRows: LockedStock[] = []) {
  const queries: RecordedQuery[] = [];
  const statements: RecordedQuery[] = [];
  const record =
    (target: RecordedQuery[], result: unknown) =>
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = Prisma.sql(strings, ...values);
      target.push({ sql: query.sql, values: query.values });
      return Promise.resolve(result);
    };
  const createMany = vi.fn(() => Promise.resolve({ count: 0 }));
  const tx = {
    $queryRaw: record(queries, lockedRows),
    $executeRaw: record(statements, 1),
    inventoryMovement: { createMany },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, queries, statements, createMany };
}

function stock(id: string, available: number, reserved = 0): LockedStock {
  return { id, variantId: `variant-${id}`, tracked: true, available, reserved };
}

function movement(item: LockedStock, availableDelta: number, reservedDelta = 0): StockMovement {
  return {
    stock: item,
    availableDelta,
    reservedDelta,
    entry: { reason: InventoryMovementReason.RECEIVED, actor: Actor.user('user-1'), note: 'box' },
  };
}

describe('InventoryLedger', () => {
  const ledger = new InventoryLedger();

  describe('lockItems', () => {
    it('locks the items of the workspace in id order, with every value as a parameter', async () => {
      const { tx, queries } = fakeTransaction([stock(ITEM_A, 1)]);

      await ledger.lockItems(tx, WORKSPACE_ID, [ITEM_B, ITEM_A, ITEM_B]);

      const [query] = queries;
      expect(query?.sql).toContain('FOR UPDATE');
      expect(query?.sql).toContain('ORDER BY id');
      expect(query?.sql).not.toContain(WORKSPACE_ID);
      expect(query?.values).toEqual([WORKSPACE_ID, [ITEM_A, ITEM_B]]);
    });

    it('does not query when there is nothing to lock', async () => {
      const { tx, queries } = fakeTransaction();

      await expect(ledger.lockItems(tx, WORKSPACE_ID, [])).resolves.toEqual([]);
      expect(queries).toHaveLength(0);
    });
  });

  describe('lockVariants', () => {
    it('returns the locked stock by variant id', async () => {
      const { tx, queries } = fakeTransaction([stock(ITEM_A, 3)]);

      const locked = await ledger.lockVariants(tx, WORKSPACE_ID, ['variant-x']);

      expect(locked.get(`variant-${ITEM_A}`)?.available).toBe(3);
      expect(queries[0]?.sql).toContain('variant_id = ANY');
    });
  });

  describe('applyMovements', () => {
    it('computes the stock after each movement from the locked row', async () => {
      const { tx, statements, createMany } = fakeTransaction();

      const after = await ledger.applyMovements(tx, WORKSPACE_ID, [
        movement(stock(ITEM_A, 4, 2), 5),
      ]);

      expect(after).toEqual([{ inventoryItemId: ITEM_A, available: 9, reserved: 2 }]);
      expect(statements[0]?.values).toEqual([[ITEM_A], [9], [2], WORKSPACE_ID]);
      expect(createMany).toHaveBeenCalledWith({
        data: [
          {
            workspaceId: WORKSPACE_ID,
            inventoryItemId: ITEM_A,
            delta: 5,
            quantityAfter: 11,
            reason: InventoryMovementReason.RECEIVED,
            note: 'box',
            actorUserId: 'user-1',
            apiKeyId: null,
          },
        ],
      });
    });

    it('writes no ledger entry when units only move between available and reserved', async () => {
      const { tx, statements, createMany } = fakeTransaction();

      await ledger.applyMovements(tx, WORKSPACE_ID, [movement(stock(ITEM_A, 4), -2, 2)]);

      expect(statements).toHaveLength(1);
      expect(createMany).not.toHaveBeenCalled();
    });

    it('records shipped units as the change in stock on hand', async () => {
      const { tx, createMany } = fakeTransaction();

      await ledger.applyMovements(tx, WORKSPACE_ID, [movement(stock(ITEM_A, 1, 3), 0, -3)]);

      expect(createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ delta: -3, quantityAfter: 1 })],
      });
    });

    it('skips movements that change nothing', async () => {
      const { tx, statements, createMany } = fakeTransaction();

      const after = await ledger.applyMovements(tx, WORKSPACE_ID, [movement(stock(ITEM_A, 4), 0)]);

      expect(after).toEqual([]);
      expect(statements).toHaveLength(0);
      expect(createMany).not.toHaveBeenCalled();
    });
  });

  describe('applyMovement', () => {
    it('returns the unchanged stock for a movement of zero', async () => {
      const { tx } = fakeTransaction();

      await expect(
        ledger.applyMovement(tx, WORKSPACE_ID, movement(stock(ITEM_B, 7, 1), 0)),
      ).resolves.toEqual({ inventoryItemId: ITEM_B, available: 7, reserved: 1 });
    });
  });
});
