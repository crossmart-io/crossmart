import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { CatalogChangeKind } from '../../events/enums/catalog-change-kind.enum.js';
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
import { ProductAdmission } from './product-admission.js';
import { ProductChangeReporter } from './product-change.reporter.js';

const PRODUCT_NOT_FOUND = 'Product not found';

/** Products and their variants: the catalog every channel listing is built from. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
    private readonly updateWriter: ProductUpdateWriter,
    private readonly admission: ProductAdmission,
    private readonly changes: ProductChangeReporter,
  ) {}

  async list(workspaceId: string, query: ProductListQuery): Promise<ProductPage> {
    const { rows, nextCursor, total } = toCountedPage(
      await this.products.listPage(workspaceId, query),
      query.limit,
    );
    return { items: rows.map((record) => toProductSummary(record)), nextCursor, total };
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
    await this.admission.assertCreatable(workspaceId, draft);
    const product = toProductDetail(await this.products.create(workspaceId, draft));
    await this.changes.report(workspaceId, actor, {
      action: ActivityAction.ProductCreated,
      product,
    });
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
    await this.assertOwnVariants(workspaceId, productId, draft);
    await this.admission.assertUpdatable(workspaceId, productId, draft);
    await this.updateWriter.update(workspaceId, productId, draft, actor);
    const product = await this.get(workspaceId, productId);
    await this.changes.report(workspaceId, actor, {
      action: ActivityAction.ProductUpdated,
      product,
      kinds: [CatalogChangeKind.Content, CatalogChangeKind.Price, CatalogChangeKind.Stock],
    });
    return product;
  }

  async delete(workspaceId: string, productId: string, actor: Actor): Promise<void> {
    await this.changes.deleting(workspaceId, [productId]);
    const deleted = await this.products.delete(workspaceId, productId);
    if (!deleted) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    await this.changes.report(workspaceId, actor, {
      action: ActivityAction.ProductDeleted,
      product: { id: productId, title: deleted.title },
    });
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
