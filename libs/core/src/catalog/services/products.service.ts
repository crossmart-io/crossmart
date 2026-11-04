import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  ) {}

  async list(workspaceId: string, query: ProductListQuery): Promise<ProductPage> {
    const records = await this.products.listPage(workspaceId, query);
    const hasMore = records.length > query.limit;
    const page = hasMore ? records.slice(0, query.limit) : records;
    return {
      items: page.map((record) => toProductSummary(record)),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
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

  async create(workspaceId: string, input: ProductDraft): Promise<ProductDetail> {
    const draft = normalizeDraft(input);
    this.assertValid(draft);
    await this.assertNoConflicts(workspaceId, draft);
    return toProductDetail(await this.products.create(workspaceId, draft));
  }

  /** Replaces the product. Variants sent with their id are edited; missing ones are removed. */
  async update(
    workspaceId: string,
    productId: string,
    input: ProductDraft,
  ): Promise<ProductDetail> {
    const draft = normalizeDraft(input);
    this.assertValid(draft);
    await this.assertOwnVariants(workspaceId, productId, draft);
    await this.assertNoConflicts(workspaceId, draft, productId);
    await this.updateWriter.update(workspaceId, productId, draft);
    return this.get(workspaceId, productId);
  }

  async delete(workspaceId: string, productId: string): Promise<void> {
    const deleted = await this.products.delete(workspaceId, productId);
    if (!deleted) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
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
