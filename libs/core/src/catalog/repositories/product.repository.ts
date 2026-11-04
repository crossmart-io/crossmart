import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService, ProductStatus } from '@crossmart/database';
import type { ProductDraft } from '../entities/product-draft.js';
import type { CatalogStats, ProductListQuery } from '../entities/product-views.js';
import {
  PRODUCT_DETAIL_INCLUDE,
  PRODUCT_SUMMARY_INCLUDE,
  type ProductDetailRecord,
  type ProductSummaryRecord,
} from './product.queries.js';
import { toProductCreateInput } from './product-write.mapper.js';

const INSENSITIVE = 'insensitive' as const;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page in title order, plus one extra row that tells the caller whether more exist. */
  listPage(workspaceId: string, query: ProductListQuery): Promise<ProductSummaryRecord[]> {
    return this.prisma.product.findMany({
      where: this.toListFilter(workspaceId, query),
      include: PRODUCT_SUMMARY_INCLUDE,
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
  }

  findDetail(workspaceId: string, productId: string): Promise<ProductDetailRecord | null> {
    return this.prisma.product.findFirst({
      where: { id: productId, workspaceId },
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  /** Handles taken in the workspace, ignoring `exceptProductId` (the product being edited). */
  async findExistingHandles(
    workspaceId: string,
    handles: string[],
    exceptProductId?: string,
  ): Promise<Set<string>> {
    const rows = await this.prisma.product.findMany({
      where: { workspaceId, handle: { in: handles }, NOT: this.except(exceptProductId) },
      select: { handle: true },
    });
    return new Set(rows.map((row) => row.handle));
  }

  /** SKUs taken in the workspace, ignoring the variants of `exceptProductId`. */
  async findExistingSkus(
    workspaceId: string,
    skus: string[],
    exceptProductId?: string,
  ): Promise<Set<string>> {
    const rows = await this.prisma.variant.findMany({
      where: {
        workspaceId,
        sku: { in: skus },
        NOT: exceptProductId ? { productId: exceptProductId } : undefined,
      },
      select: { sku: true },
    });
    return new Set(rows.flatMap((row) => (row.sku ? [row.sku] : [])));
  }

  create(workspaceId: string, draft: ProductDraft): Promise<ProductDetailRecord> {
    return this.prisma.product.create({
      data: toProductCreateInput(workspaceId, draft),
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  /** Creates the drafts in one transaction: all of them or none. */
  async createAll(workspaceId: string, drafts: ProductDraft[]): Promise<void> {
    await this.prisma.$transaction(
      drafts.map((draft) =>
        this.prisma.product.create({
          data: toProductCreateInput(workspaceId, draft),
          select: { id: true },
        }),
      ),
    );
  }

  /** Ids of the product's variants, or null when the product is not in this workspace. */
  async findVariantIds(workspaceId: string, productId: string): Promise<Set<string> | null> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, workspaceId },
      select: { variants: { select: { id: true } } },
    });
    return product ? new Set(product.variants.map((variant) => variant.id)) : null;
  }

  async countStats(workspaceId: string): Promise<CatalogStats> {
    const [byStatus, variants, outOfStockVariants] = await Promise.all([
      this.prisma.product.groupBy({ by: ['status'], where: { workspaceId }, _count: true }),
      this.prisma.variant.count({ where: { workspaceId } }),
      this.prisma.inventoryItem.count({
        where: { workspaceId, tracked: true, available: { lte: 0 } },
      }),
    ]);
    const countOf = (status: ProductStatus): number =>
      byStatus.find((group) => group.status === status)?._count ?? 0;
    return {
      products: byStatus.reduce((sum, group) => sum + group._count, 0),
      activeProducts: countOf(ProductStatus.ACTIVE),
      draftProducts: countOf(ProductStatus.DRAFT),
      archivedProducts: countOf(ProductStatus.ARCHIVED),
      variants,
      outOfStockVariants,
    };
  }

  /** Returns false when the product does not exist in this workspace. */
  async delete(workspaceId: string, productId: string): Promise<boolean> {
    const { count } = await this.prisma.product.deleteMany({
      where: { id: productId, workspaceId },
    });
    return count > 0;
  }

  private toListFilter(workspaceId: string, query: ProductListQuery): Prisma.ProductWhereInput {
    const search = query.search?.trim();
    return {
      workspaceId,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: INSENSITIVE } },
              { handle: { contains: search, mode: INSENSITIVE } },
              { variants: { some: { sku: { contains: search, mode: INSENSITIVE } } } },
            ],
          }
        : {}),
    };
  }

  private except(productId: string | undefined): Prisma.ProductWhereInput | undefined {
    return productId ? { id: productId } : undefined;
  }
}
