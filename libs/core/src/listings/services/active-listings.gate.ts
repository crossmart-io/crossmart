import { Injectable } from '@nestjs/common';
import type { Prisma } from '@crossmart/database';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementExceededException } from '../../entitlements/errors/entitlement-exceeded.exception.js';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { goingLiveWhere } from '../rules/listing-visibility.js';

/** The store a publish is for. */
export interface PublishScope {
  workspaceId: string;
  connectionId: string;
}

/**
 * Keeps active listings within the plan's `Feature.ActiveListings` limit. The API asks before it
 * queues a publish, so a request that cannot fit fails whole and changes nothing; the worker
 * asks again for each listing it is about to make live, which catches what was queued earlier.
 */
@Injectable()
export class ActiveListingsGate {
  constructor(
    private readonly products: ProductSelectionRepository,
    private readonly entitlements: EntitlementService,
  ) {}

  /** Throws `EntitlementExceededException` (402) when publishing `where` would not fit. */
  async assertRoomFor(scope: PublishScope, where: Prisma.ProductWhereInput): Promise<void> {
    if (!this.entitlements.enforced) return;
    const goingLive = await this.products.count(goingLiveWhere(scope.connectionId, where));
    if (goingLive === 0) return;
    await this.entitlements.assertInWorkspace(scope.workspaceId, Feature.ActiveListings, goingLive);
  }

  /** The refusal for one more active listing in the workspace, or null while it fits. */
  refusalForOneMore(workspaceId: string): Promise<EntitlementExceededException | null> {
    return this.entitlements.violationInWorkspace(workspaceId, Feature.ActiveListings);
  }
}
