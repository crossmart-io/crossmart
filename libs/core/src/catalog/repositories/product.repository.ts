import { Injectable } from '@nestjs/common';
import { InventoryMovementReason, type Prisma, PrismaService } from '@crossmart/database';
import type { ProductListQuery } from '../entities/product-views.js';
import type { MediaDraft, ProductDraft, VariantDraft } from '../entities/product-draft.js';
import {
  PRODUCT_DETAIL_INCLUDE,
  PRODUCT_SUMMARY_INCLUDE,
  type ProductDetailRecord,
  type ProductSummaryRecord,
} from './product.queries.js';

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

  async findExistingHandles(workspaceId: string, handles: string[]): Promise<Set<string>> {
    const rows = await this.prisma.product.findMany({
      where: { workspaceId, handle: { in: handles } },
      select: { handle: true },
    });
    return new Set(rows.map((row) => row.handle));
  }

  async findExistingSkus(workspaceId: string, skus: string[]): Promise<Set<string>> {
    const rows = await this.prisma.variant.findMany({
      where: { workspaceId, sku: { in: skus } },
      select: { sku: true },
    });
    return new Set(rows.flatMap((row) => (row.sku ? [row.sku] : [])));
  }

  create(workspaceId: string, draft: ProductDraft): Promise<ProductDetailRecord> {
    return this.prisma.product.create({
      data: this.toCreateInput(workspaceId, draft),
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  /** Creates the drafts in one transaction: all of them or none. */
  async createAll(workspaceId: string, drafts: ProductDraft[]): Promise<void> {
    await this.prisma.$transaction(
      drafts.map((draft) =>
        this.prisma.product.create({
          data: this.toCreateInput(workspaceId, draft),
          select: { id: true },
        }),
      ),
    );
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

  private toCreateInput(workspaceId: string, draft: ProductDraft): Prisma.ProductCreateInput {
    return {
      workspace: { connect: { id: workspaceId } },
      handle: draft.handle,
      title: draft.title,
      descriptionHtml: draft.descriptionHtml,
      vendor: draft.vendor,
      productType: draft.productType,
      tags: draft.tags,
      status: draft.status,
      optionNames: draft.optionNames,
      variants: {
        create: draft.variants.map((variant, position) =>
          this.toVariantInput(workspaceId, variant, position),
        ),
      },
      media: {
        create: draft.media.map((media, position) =>
          this.toMediaInput(workspaceId, media, position),
        ),
      },
    };
  }

  private toVariantInput(
    workspaceId: string,
    variant: VariantDraft,
    position: number,
  ): Prisma.VariantCreateWithoutProductInput {
    const { inventory, ...fields } = variant;
    return {
      ...fields,
      workspaceId,
      position,
      inventoryItem: {
        create: {
          workspaceId,
          tracked: inventory.tracked,
          available: inventory.quantity,
          movements:
            inventory.quantity === 0
              ? undefined
              : {
                  create: {
                    workspaceId,
                    delta: inventory.quantity,
                    reason: InventoryMovementReason.OPENING_BALANCE,
                  },
                },
        },
      },
    };
  }

  private toMediaInput(
    workspaceId: string,
    media: MediaDraft,
    position: number,
  ): Prisma.ProductMediaCreateWithoutProductInput {
    return { workspaceId, url: media.url, altText: media.altText, position };
  }
}
