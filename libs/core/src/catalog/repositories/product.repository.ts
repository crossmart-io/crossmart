import { sortWithTiebreak } from '@crossmart/common';
import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService, ProductStatus } from '@crossmart/database';
import { storeFilterWhere, toProductListWhere } from './product-list.filter.js';
import type { ProductDraft } from '../entities/product-draft.js';
import type { CatalogGapCount, CatalogStats, ProductListQuery } from '../entities/product-views.js';
import { CatalogGap } from '../enums/catalog-gap.enum.js';
import { CATALOG_GAP_FILTERS } from './catalog-gap.filters.js';
import {
  PRODUCT_DETAIL_INCLUDE,
  PRODUCT_SUMMARY_INCLUDE,
  PRODUCT_UPDATE_TARGET_SELECT,
  type ProductDetailRecord,
  type ProductSummaryRecord,
  type ProductUpdateTargetRecord,
} from './product.queries.js';
import { toProductCreateInput } from './product-write.mapper.js';

export interface DeletedProduct {
  title: string;
}

/** A created variant with the ids an import maps to the channel and sets stock on. */
export interface CreatedVariant {
  id: string;
  position: number;
  inventoryItemId: string | null;
}

export interface CreatedProduct {
  id: string;
  variants: CreatedVariant[];
}

const CREATED_PRODUCT_SELECT = {
  id: true,
  variants: {
    select: { id: true, position: true, inventoryItem: { select: { id: true } } },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page in the query's order, plus one extra row that says whether more exist. */
  listPage(workspaceId: string, query: ProductListQuery): Promise<ProductSummaryRecord[]> {
    return this.prisma.product.findMany({
      where: {
        AND: [
          toProductListWhere(workspaceId, query),
          storeFilterWhere(query.storeFilter, query.storeId),
        ],
      },
      include: PRODUCT_SUMMARY_INCLUDE,
      orderBy: sortWithTiebreak(query.sort, query.direction),
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

  /** The products with these handles, with what an update import matches against. */
  findUpdateTargets(workspaceId: string, handles: string[]): Promise<ProductUpdateTargetRecord[]> {
    return this.prisma.product.findMany({
      where: { workspaceId, handle: { in: handles } },
      select: PRODUCT_UPDATE_TARGET_SELECT,
    });
  }

  /** The product that holds each of these SKUs in the workspace, by SKU. */
  async findSkuOwners(workspaceId: string, skus: string[]): Promise<Map<string, string>> {
    const rows = await this.prisma.variant.findMany({
      where: { workspaceId, sku: { in: skus } },
      select: { sku: true, productId: true },
    });
    return new Map(rows.flatMap((row) => (row.sku ? [[row.sku, row.productId] as const] : [])));
  }

  create(workspaceId: string, draft: ProductDraft): Promise<ProductDetailRecord> {
    return this.prisma.product.create({
      data: toProductCreateInput(workspaceId, draft),
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  /** Creates the drafts in one transaction: all of them or none. */
  /** Creates the products in one transaction and returns their ids, in draft order. */
  async createAll(workspaceId: string, drafts: ProductDraft[]): Promise<string[]> {
    const created = await this.prisma.$transaction(
      drafts.map((draft) =>
        this.prisma.product.create({
          data: toProductCreateInput(workspaceId, draft),
          select: { id: true },
        }),
      ),
    );
    return created.map((product) => product.id);
  }

  /**
   * Creates the products in one transaction and returns them in draft order, with their
   * variants in position order and the stock item of each.
   */
  async createAllWithVariants(
    workspaceId: string,
    drafts: ProductDraft[],
  ): Promise<CreatedProduct[]> {
    const created = await this.prisma.$transaction(
      drafts.map((draft) =>
        this.prisma.product.create({
          data: toProductCreateInput(workspaceId, draft),
          select: CREATED_PRODUCT_SELECT,
        }),
      ),
    );
    return created.map((product) => ({
      id: product.id,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        position: variant.position,
        inventoryItemId: variant.inventoryItem?.id ?? null,
      })),
    }));
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
    const [byStatus, variants, outOfStockVariants, gaps] = await Promise.all([
      this.prisma.product.groupBy({ by: ['status'], where: { workspaceId }, _count: true }),
      this.prisma.variant.count({ where: { workspaceId } }),
      this.prisma.inventoryItem.count({
        where: { workspaceId, tracked: true, available: { lte: 0 } },
      }),
      this.countGaps(workspaceId),
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
      gaps,
    };
  }

  private countGaps(workspaceId: string): Promise<CatalogGapCount[]> {
    return Promise.all(
      Object.values(CatalogGap).map(async (gap) => ({
        gap,
        products: await this.prisma.product.count({
          where: { workspaceId, ...CATALOG_GAP_FILTERS[gap] },
        }),
      })),
    );
  }

  /** Returns the deleted product's title, or null when it is not in this workspace. */
  async delete(workspaceId: string, productId: string): Promise<DeletedProduct | null> {
    const where = { id: productId, workspaceId };
    const product = await this.prisma.product.findFirst({ where, select: { title: true } });
    if (!product) return null;
    const { count } = await this.prisma.product.deleteMany({ where });
    return count > 0 ? product : null;
  }

  private except(productId: string | undefined): Prisma.ProductWhereInput | undefined {
    return productId ? { id: productId } : undefined;
  }
}
