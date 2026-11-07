import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import type { ProductDraft } from '../entities/product-draft.js';
import { findDraftProblems } from '../rules/product-draft.rules.js';
import { CatalogConflictsService } from './catalog-conflicts.service.js';

/**
 * Whether a product may be saved: a valid draft whose handle and SKUs no other product uses,
 * and, for a new one, room for it when the workspace is an unclaimed sandbox account.
 */
@Injectable()
export class ProductAdmission {
  constructor(
    private readonly conflicts: CatalogConflictsService,
    private readonly entitlements: EntitlementService,
  ) {}

  /** `draft` must be normalized. */
  async assertCreatable(workspaceId: string, draft: ProductDraft): Promise<void> {
    this.assertValid(draft);
    await this.assertNoConflicts(workspaceId, draft);
    await this.entitlements.assertProductRoom(workspaceId);
  }

  /** `draft` must be normalized; the product's own handle and SKUs are no conflict. */
  async assertUpdatable(
    workspaceId: string,
    productId: string,
    draft: ProductDraft,
  ): Promise<void> {
    this.assertValid(draft);
    await this.assertNoConflicts(workspaceId, draft, productId);
  }

  private assertValid(draft: ProductDraft): void {
    const [problem] = findDraftProblems(draft);
    if (problem) {
      throw new BadRequestException(problem.message);
    }
  }

  private async assertNoConflicts(
    workspaceId: string,
    draft: ProductDraft,
    exceptProductId?: string,
  ): Promise<void> {
    const { existing, skuConflicts } = await this.conflicts.check(
      workspaceId,
      [draft],
      exceptProductId,
    );
    const [conflict] = [...existing, ...skuConflicts];
    if (conflict) {
      throw new ConflictException(conflict.message);
    }
  }
}
