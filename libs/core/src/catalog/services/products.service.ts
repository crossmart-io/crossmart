import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toCursorPage } from '@crossmart/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ProductDraft } from '../entities/product-draft.js';
import type {
  CatalogStats,
  ProductDetail,
  ProductListQuery,
  ProductPage,
} from '../entities/product-views.js';
import { toProductDetail, toProductSummary } from '../mappers/product-view.mapper.js';
import { ProductUpdateWriter } from '../repositories/product-update.writer.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { normalizeDraft } from '../rules/normalize-draft.js';
import { findDraftProblems } from '../rules/product-draft.rules.js';
import { CatalogConflictsService } from './catalog-conflicts.service.js';

const PRODUCT_NOT_FOUND = 'Product not found';

/** Products and their variants: the catalog every channel listing is built from. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
    private readonly updateWriter: ProductUpdateWriter,
    private readonly conflicts: CatalogConflictsService,
    private readonly activity: ActivityRecorder,
  ) {}

  async list(workspaceId: string, query: ProductListQuery): Promise<ProductPage> {
    const { rows, nextCursor } = toCursorPage(
      await this.products.listPage(workspaceId, query),
      query.limit,
    );
    return { items: rows.map((record) => toProductSummary(record)), nextCursor };
  }

  stats(workspaceId: string): Promise<CatalogStats> {
    return this.products.countStats(workspaceId);
  }

  async get(workspaceId: string, productId: string): Promise<ProductDetail> {
    const record = await this.products.findDetail(workspaceId, productId);
    if (!record) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    return toProductDetail(record);
  }

  async create(workspaceId: string, input: ProductDraft, actor: Actor): Promise<ProductDetail> {
    const draft = normalizeDraft(input);
    this.assertValid(draft);
    await this.assertNoConflicts(workspaceId, draft);
    const product = toProductDetail(await this.products.create(workspaceId, draft));
    await this.recordChange(workspaceId, actor, ActivityAction.ProductCreated, product);
    return product;
  }

  /** Replaces the product. Variants sent with their id are edited; missing ones are removed. */
  async update(
    workspaceId: string,
    productId: string,
    input: ProductDraft,
    actor: Actor,
  ): Promise<ProductDetail> {
    const draft = normalizeDraft(input);
    this.assertValid(draft);
    await this.assertOwnVariants(workspaceId, productId, draft);
    await this.assertNoConflicts(workspaceId, draft, productId);
    await this.updateWriter.update(workspaceId, productId, draft, actor);
    const product = await this.get(workspaceId, productId);
    await this.recordChange(workspaceId, actor, ActivityAction.ProductUpdated, product);
    return product;
  }

  async delete(workspaceId: string, productId: string, actor: Actor): Promise<void> {
    const deleted = await this.products.delete(workspaceId, productId);
    if (!deleted) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    await this.recordChange(workspaceId, actor, ActivityAction.ProductDeleted, {
      id: productId,
      title: deleted.title,
    });
  }

  private recordChange(
    workspaceId: string,
    actor: Actor,
    action: ActivityAction,
    product: Pick<ProductDetail, 'id' | 'title'>,
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action,
      subject: { type: ActivitySubjectType.Product, id: product.id, label: product.title },
    });
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

  /** A variant id from another product (or workspace) must never be accepted. */
  private async assertOwnVariants(
    workspaceId: string,
    productId: string,
    draft: ProductDraft,
  ): Promise<void> {
    const variantIds = await this.products.findVariantIds(workspaceId, productId);
    if (!variantIds) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    const foreign = draft.variants.find((variant) => variant.id && !variantIds.has(variant.id));
    if (foreign) {
      throw new BadRequestException(`Variant ${foreign.id} does not belong to this product`);
    }
  }
}
