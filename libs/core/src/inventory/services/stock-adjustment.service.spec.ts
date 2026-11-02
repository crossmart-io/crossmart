import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryMovementReason } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { StockAdjustment, StockSnapshot } from '../entities/stock-adjustment.js';
import { StockAdjustmentMode } from '../enums/stock-adjustment-mode.enum.js';
import { MAX_STOCK_QUANTITY } from '../inventory.constants.js';
import type { InventoryItemRepository } from '../repositories/inventory-item.repository.js';
import type { StockAdjustmentWriter } from '../repositories/stock-adjustment.writer.js';
import { inventoryRecord, ITEM_ID, WORKSPACE_ID } from './inventory.fixtures.js';
import { StockAdjustmentService } from './stock-adjustment.service.js';

const STOCK: StockSnapshot = { tracked: true, available: 7, reserved: 2 };

function adjustment(overrides: Partial<StockAdjustment> = {}): StockAdjustment {
  return {
    mode: StockAdjustmentMode.Delta,
    quantity: 5,
    reason: InventoryMovementReason.RECEIVED,
    actor: Actor.user('user-1'),
    ...overrides,
  };
}

/** The writer is mocked to resolve the delta against `stock`, as the real one does under a lock. */
function setup(stock: StockSnapshot | null = STOCK) {
  const resolvedDeltas: number[] = [];
  const writer = {
    adjust: vi.fn<StockAdjustmentWriter['adjust']>(async (_ws, _id, _adjustment, resolve) => {
      if (!stock) return null;
      const delta = resolve(stock);
      resolvedDeltas.push(delta);
      return delta;
    }),
  };
  const items = {
    findRow: vi.fn<InventoryItemRepository['findRow']>().mockResolvedValue(inventoryRecord()),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new StockAdjustmentService(
    items as unknown as InventoryItemRepository,
    writer as unknown as StockAdjustmentWriter,
    activity,
  );
  return { service, writer, resolvedDeltas, activity };
}

describe('StockAdjustmentService', () => {
  it('adds a delta to the stock on hand and returns the new row', async () => {
    const { service, resolvedDeltas } = setup();

    const row = await service.adjust(WORKSPACE_ID, ITEM_ID, adjustment({ quantity: -3 }));

    expect(resolvedDeltas).toEqual([-3]);
    expect(row.inventoryItemId).toBe(ITEM_ID);
  });

  it('turns a counted quantity into the delta from the stock on hand', async () => {
    const { service, resolvedDeltas } = setup();

    await service.adjust(
      WORKSPACE_ID,
      ITEM_ID,
      adjustment({ mode: StockAdjustmentMode.Set, quantity: 4 }),
    );
    await service.adjust(
      WORKSPACE_ID,
      ITEM_ID,
      adjustment({ mode: StockAdjustmentMode.Set, quantity: 9 }),
    );

    expect(resolvedDeltas).toEqual([-5, 0]);
  });

  it('refuses to take stock on hand below zero or above the limit', async () => {
    const { service } = setup();

    await expect(
      service.adjust(WORKSPACE_ID, ITEM_ID, adjustment({ quantity: -10 })),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.adjust(
        WORKSPACE_ID,
        ITEM_ID,
        adjustment({ mode: StockAdjustmentMode.Set, quantity: MAX_STOCK_QUANTITY + 1 }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses untracked variants and reasons only the system may record', async () => {
    const untracked = setup({ ...STOCK, tracked: false });
    await expect(untracked.service.adjust(WORKSPACE_ID, ITEM_ID, adjustment())).rejects.toThrow(
      BadRequestException,
    );

    const { service, writer } = setup();
    await expect(
      service.adjust(
        WORKSPACE_ID,
        ITEM_ID,
        adjustment({ reason: InventoryMovementReason.OPENING_BALANCE }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(writer.adjust).not.toHaveBeenCalled();
  });

  it('404s an item that is not in the workspace', async () => {
    const { service } = setup(null);

    await expect(service.adjust(WORKSPACE_ID, ITEM_ID, adjustment())).rejects.toThrow(
      NotFoundException,
    );
  });

  it('records the change in the activity log of the product, by who made it', async () => {
    const { service, activity } = setup();
    const actor = Actor.apiKey('key-1');

    await service.adjust(WORKSPACE_ID, ITEM_ID, adjustment({ quantity: 5, actor }));

    expect(activity.recorded).toEqual([
      {
        workspaceId: WORKSPACE_ID,
        actor,
        entry: {
          action: ActivityAction.InventoryAdjusted,
          subject: { type: ActivitySubjectType.Product, id: 'product-1', label: 'Stoneware Mug' },
          detail: 'MUG-BLUE +5, received',
        },
      },
    ]);
  });

  it('records nothing when the count matches the stock or the adjustment is refused', async () => {
    const { service, activity } = setup();

    await service.adjust(
      WORKSPACE_ID,
      ITEM_ID,
      adjustment({ mode: StockAdjustmentMode.Set, quantity: 9 }),
    );
    await service
      .adjust(WORKSPACE_ID, ITEM_ID, adjustment({ quantity: -10 }))
      .catch(() => undefined);

    expect(activity.recorded).toEqual([]);
  });
});
