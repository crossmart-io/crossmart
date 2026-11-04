import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService, type ProductStatus } from '@crossmart/database';

const PERCENT = 100;

/**
 * Set-based writes over many products at once: one statement per action, whatever the
 * selection size. Every statement is scoped to the workspace, so foreign ids change nothing.
 */
@Injectable()
export class ProductBulkWriter {
  constructor(private readonly prisma: PrismaService) {}

  async setStatus(
    workspaceId: string,
    productIds: string[],
    status: ProductStatus,
  ): Promise<number> {
    const { count } = await this.prisma.product.updateMany({
      where: { workspaceId, id: { in: productIds } },
      data: { status },
    });
    return count;
  }

  /** Adds the tags each product does not have yet, keeping the rest and their order. */
  addTags(workspaceId: string, productIds: string[], tags: string[]): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE products
      SET tags = tags || ARRAY(
            SELECT tag FROM unnest(${tags}::text[]) AS tag
            WHERE NOT (lower(tag) = ANY (SELECT lower(existing) FROM unnest(products.tags) AS existing))
          ),
          updated_at = now()
      WHERE workspace_id = ${workspaceId}::uuid AND id = ANY (${productIds}::uuid[])`;
  }

  /** Removes the tags, ignoring case, from each product that has them. */
  removeTags(workspaceId: string, productIds: string[], tags: string[]): Promise<number> {
    const lowered = tags.map((tag) => tag.toLowerCase());
    return this.prisma.$executeRaw`
      UPDATE products
      SET tags = ARRAY(
            SELECT tag FROM unnest(tags) WITH ORDINALITY AS kept(tag, position)
            WHERE NOT (lower(tag) = ANY (${lowered}::text[]))
            ORDER BY position
          ),
          updated_at = now()
      WHERE workspace_id = ${workspaceId}::uuid AND id = ANY (${productIds}::uuid[])`;
  }

  /** Moves every variant price by `percent`, rounded to cents and never below zero. */
  async adjustPrices(workspaceId: string, productIds: string[], percent: number): Promise<number> {
    const factor = new Prisma.Decimal(PERCENT + percent).dividedBy(PERCENT);
    await this.prisma.$executeRaw`
      UPDATE variants
      SET price = GREATEST(round(price * ${factor}::numeric, 2), 0),
          compare_at_price = CASE
            WHEN compare_at_price IS NULL THEN NULL
            ELSE GREATEST(round(compare_at_price * ${factor}::numeric, 2), 0)
          END,
          updated_at = now()
      WHERE workspace_id = ${workspaceId}::uuid AND product_id = ANY (${productIds}::uuid[])`;
    return this.countOwned(workspaceId, productIds);
  }

  async delete(workspaceId: string, productIds: string[]): Promise<number> {
    const { count } = await this.prisma.product.deleteMany({
      where: { workspaceId, id: { in: productIds } },
    });
    return count;
  }

  private countOwned(workspaceId: string, productIds: string[]): Promise<number> {
    return this.prisma.product.count({ where: { workspaceId, id: { in: productIds } } });
  }
}
