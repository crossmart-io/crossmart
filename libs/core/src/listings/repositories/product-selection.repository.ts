import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import {
  PRODUCT_SUMMARY_INCLUDE,
  type ProductSummaryRecord,
} from '../../catalog/repositories/product.queries.js';

const TITLE_ORDER = [
  { title: 'asc' },
  { id: 'asc' },
] as const satisfies Prisma.ProductOrderByWithRelationInput[];

/** Reads the products a selection condition matches. Every condition is workspace-scoped. */
@Injectable()
export class ProductSelectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.ProductWhereInput): Promise<number> {
    return this.prisma.product.count({ where });
  }

  /** One page in title order, plus one extra row that says whether more exist. */
  listPage(
    where: Prisma.ProductWhereInput,
    limit: number,
    cursor?: string,
  ): Promise<ProductSummaryRecord[]> {
    return this.prisma.product.findMany({
      where,
      include: PRODUCT_SUMMARY_INCLUDE,
      orderBy: TITLE_ORDER,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  /** Ids in id order after `afterId`, so large selections are read in batches. */
  async listIds(
    where: Prisma.ProductWhereInput,
    limit: number,
    afterId?: string,
  ): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      where: afterId ? { AND: [where, { id: { gt: afterId } }] } : where,
      select: { id: true },
      orderBy: { id: 'asc' },
      take: limit,
    });
    return rows.map((row) => row.id);
  }

  async matches(where: Prisma.ProductWhereInput, productId: string): Promise<boolean> {
    return (await this.prisma.product.count({ where: { AND: [where, { id: productId }] } })) > 0;
  }
}
