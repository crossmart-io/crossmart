import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { InventoryRow } from '../entities/inventory-views.js';
import type { StockAdjustment, StockSnapshot } from '../entities/stock-adjustment.js';
import { StockAdjustmentMode } from '../enums/stock-adjustment-mode.enum.js';
import {
  INVENTORY_ITEM_NOT_FOUND,
  MANUAL_MOVEMENT_REASONS,
  MAX_STOCK_QUANTITY,
} from '../inventory.constants.js';
import { toInventoryRow } from '../mappers/inventory-view.mapper.js';
import { InventoryItemRepository } from '../repositories/inventory-item.repository.js';
import { StockAdjustmentWriter } from '../repositories/stock-adjustment.writer.js';
import { describeStockChange } from '../rules/stock-change-detail.js';

const NOT_TRACKED = 'This variant does not track stock. Turn tracking on in the product first.';
const SYSTEM_REASON = 'This reason is recorded by Crossmart and cannot be given by hand';
const TOO_MUCH_STOCK = `Stock on hand cannot exceed ${MAX_STOCK_QUANTITY} units`;

/**
 * Manual changes to stock on hand: deliveries, counts, damage. Every change is in the ledger,
 * and in the activity log of its product.
 */
@Injectable()
export class StockAdjustmentService {
  constructor(
    private readonly items: InventoryItemRepository,
    private readonly writer: StockAdjustmentWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  /** Applies the adjustment and returns the item's new stock. Setting the same stock is a no-op. */
  async adjust(
    workspaceId: string,
    inventoryItemId: string,
    adjustment: StockAdjustment,
  ): Promise<InventoryRow> {
    if (!MANUAL_MOVEMENT_REASONS.includes(adjustment.reason)) {
      throw new BadRequestException(SYSTEM_REASON);
    }
    const delta = await this.writer.adjust(workspaceId, inventoryItemId, adjustment, (stock) =>
      this.resolveDelta(stock, adjustment),
    );
    const record = delta === null ? null : await this.items.findRow(workspaceId, inventoryItemId);
    if (!record) {
      throw new NotFoundException(INVENTORY_ITEM_NOT_FOUND);
    }
    const row = toInventoryRow(record);
    if (delta) {
      await this.recordAdjustment(workspaceId, adjustment, row, delta);
    }
    return row;
  }

  private resolveDelta(stock: StockSnapshot, adjustment: StockAdjustment): number {
    if (!stock.tracked) {
      throw new BadRequestException(NOT_TRACKED);
    }
    const onHand = stock.available + stock.reserved;
    const delta =
      adjustment.mode === StockAdjustmentMode.Set
        ? adjustment.quantity - onHand
        : adjustment.quantity;
    this.assertWithinLimits(onHand, onHand + delta);
    return delta;
  }

  private assertWithinLimits(onHand: number, nextOnHand: number): void {
    if (nextOnHand < 0) {
      throw new BadRequestException(`Stock on hand cannot go below zero (${onHand} on hand now)`);
    }
    if (nextOnHand > MAX_STOCK_QUANTITY) {
      throw new BadRequestException(TOO_MUCH_STOCK);
    }
  }

  /** The product is the subject, so the change shows in the product's own history. */
  private recordAdjustment(
    workspaceId: string,
    adjustment: StockAdjustment,
    row: InventoryRow,
    delta: number,
  ): Promise<void> {
    return this.activity.record(workspaceId, adjustment.actor, {
      action: ActivityAction.InventoryAdjusted,
      subject: { type: ActivitySubjectType.Product, id: row.productId, label: row.productTitle },
      detail: describeStockChange({ ...row, delta, reason: adjustment.reason }),
    });
  }
}
