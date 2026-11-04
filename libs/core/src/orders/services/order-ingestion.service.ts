import { Injectable, Logger } from '@nestjs/common';
import type { ExternalOrder } from '@crossmart/connectors';
import { ActivityOutcome } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { CatalogEventBus } from '../../events/services/catalog-event-bus.js';
import type { OversoldItem, StoredOrder } from '../entities/order-ingestion.js';
import { OrderVariantMatcher } from '../repositories/order-variant.matcher.js';
import { OrderWriter } from '../repositories/order.writer.js';

/** The connection an order came from, as ingestion needs it. */
export interface OrderOrigin {
  workspaceId: string;
  connectionId: string;
  storeName: string;
  /** Orders placed before Crossmart read the store's orders were sold from stock it never held. */
  syncedFrom: Date;
}

const SKIPPED: StoredOrder = { applied: false, changedInventoryItemIds: [], oversold: [] };

/**
 * Takes in a channel order: stores it, reserves or releases its stock, then sends the new
 * quantities to every channel that lists the variants (ADR 0007). Units sold twice are
 * logged as a failed activity, for the merchant to resolve.
 */
@Injectable()
export class OrderIngestionService {
  private readonly logger = new Logger(OrderIngestionService.name);

  constructor(
    private readonly matcher: OrderVariantMatcher,
    private readonly writer: OrderWriter,
    private readonly events: CatalogEventBus,
    private readonly activity: ActivityRecorder,
  ) {}

  async ingest(origin: OrderOrigin, order: ExternalOrder): Promise<StoredOrder> {
    if (order.placedAt < origin.syncedFrom) return SKIPPED;
    const { workspaceId, connectionId } = origin;
    const variantIds = await this.matcher.match(workspaceId, connectionId, order.lines);
    const stored = await this.writer.store({ workspaceId, connectionId, order, variantIds });
    await this.events.stockChanged({
      workspaceId,
      inventoryItemIds: stored.changedInventoryItemIds,
    });
    for (const item of stored.oversold) {
      await this.recordOversold(origin, order, item);
    }
    return stored;
  }

  private recordOversold(
    origin: OrderOrigin,
    order: ExternalOrder,
    item: OversoldItem,
  ): Promise<void> {
    this.logger.warn(`Order ${order.name} oversold item ${item.inventoryItemId}`);
    return this.activity.record(origin.workspaceId, Actor.system(), {
      action: ActivityAction.StockOversold,
      outcome: ActivityOutcome.FAILED,
      subject: { type: ActivitySubjectType.Product, id: item.productId, label: item.productTitle },
      detail: `order ${order.name} on ${origin.storeName}, ${-item.available} more than in stock`,
      failureReason: `${-item.available} units were sold twice`,
    });
  }
}
