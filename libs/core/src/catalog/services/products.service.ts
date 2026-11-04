import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProductDraft } from '../entities/product-draft.js';
import type { ProductDetail, ProductListQuery, ProductPage } from '../entities/product-views.js';
import { toProductDetail, toProductSummary } from '../mappers/product-view.mapper.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { findDraftProblems } from '../rules/product-draft.rules.js';
import { CatalogConflictsService } from './catalog-conflicts.service.js';

const PRODUCT_NOT_FOUND = 'Product not found';

/** Products and their variants: the catalog every channel listing is built from. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
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

  async get(workspaceId: string, productId: string): Promise<ProductDetail> {
    const record = await this.products.findDetail(workspaceId, productId);
    if (!record) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    return toProductDetail(record);
  }

  async create(workspaceId: string, draft: ProductDraft): Promise<ProductDetail> {
    const [problem] = findDraftProblems(draft);
    if (problem) {
      throw new BadRequestException(problem.message);
    }
    const { existing, skuConflicts } = await this.conflicts.check(workspaceId, [draft]);
    const [conflict] = [...existing, ...skuConflicts];
    if (conflict) {
      throw new ConflictException(conflict.message);
    }
    return toProductDetail(await this.products.create(workspaceId, draft));
  }

  async delete(workspaceId: string, productId: string): Promise<void> {
    const deleted = await this.products.delete(workspaceId, productId);
    if (!deleted) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
  }
}
