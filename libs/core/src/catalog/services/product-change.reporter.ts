import { Injectable } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import type { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { CatalogChangeKind } from '../../events/enums/catalog-change-kind.enum.js';
import { CatalogEventBus } from '../../events/services/catalog-event-bus.js';
import type { ProductDetail } from '../entities/product-views.js';

/** A change to one product, as it is reported after the write. */
export interface ProductChange {
  action: ActivityAction;
  product: Pick<ProductDetail, 'id' | 'title'>;
  /** What changed, for listeners such as channel sync. None for creates and deletes. */
  kinds?: CatalogChangeKind[];
}

/** Reports a product change: to the activity log, and to catalog listeners. Never throws. */
@Injectable()
export class ProductChangeReporter {
  constructor(
    private readonly activity: ActivityRecorder,
    private readonly events: CatalogEventBus,
  ) {}

  async report(workspaceId: string, actor: Actor, change: ProductChange): Promise<void> {
    const { product } = change;
    await this.activity.record(workspaceId, actor, {
      action: change.action,
      subject: { type: ActivitySubjectType.Product, id: product.id, label: product.title },
    });
    if (change.kinds?.length) {
      await this.events.productsChanged({
        workspaceId,
        productIds: [product.id],
        kinds: change.kinds,
      });
    }
  }

  /** Lets listeners act on products before they are deleted, such as delisting them. */
  deleting(workspaceId: string, productIds: string[]): Promise<void> {
    return this.events.productsDeleting({ workspaceId, productIds });
  }
}
