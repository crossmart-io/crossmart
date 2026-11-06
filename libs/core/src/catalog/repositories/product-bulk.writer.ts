import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService, type ProductStatus } from '@crossmart/database';
import { ProductWebhookEvents } from './product-webhook-events.js';

const PERCENT = 100;

type Transaction = Prisma.TransactionClient;

/**
 * Set-based writes over many products at once: one statement per action, whatever the
 * selection size. Every statement is scoped to the workspace, so foreign ids change nothing.
 * Each write publishes its `product.*` webhook events in the same transaction.
 */
@Injectable()
export class ProductBulkWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookEvents: ProductWebhookEvents,
  ) {}

  setStatus(workspaceId: string, productIds: string[], status: ProductStatus): Promise<number> {
    return this.updateAndPublish(workspaceId, productIds, async (tx) => {
      const { count } = await tx.product.updateMany({
        where: { workspaceId, id: { in: productIds } },
        data: { status },
      });
      return count;
    });
  }

  /** Adds the tags each product does not have yet, keeping the rest and their order. */
  addTags(workspaceId: string, productIds: string[], tags: string[]): Promise<number> {
    return this.updateAndPublish(
      workspaceId,
      productIds,
      (tx) => tx.$executeRaw`
        UPDATE products
        SET tags = tags || ARRAY(
              SELECT tag FROM unnest(${tags}::text[]) AS tag
              WHERE NOT (lower(tag) = ANY (SELECT lower(existing) FROM unnest(products.tags) AS existing))
            ),
            updated_at = now()
        WHERE workspace_id = ${workspaceId}::uuid AND id = ANY (${productIds}::uuid[])`,
    );
  }

  /** Removes the tags, ignoring case, from each product that has them. */
  removeTags(workspaceId: string, productIds: string[], tags: string[]): Promise<number> {
    const lowered = tags.map((tag) => tag.toLowerCase());
    return this.updateAndPublish(
      workspaceId,
      productIds,
      (tx) => tx.$executeRaw`
        UPDATE products
        SET tags = ARRAY(
              SELECT tag FROM unnest(tags) WITH ORDINALITY AS kept(tag, position)
              WHERE NOT (lower(tag) = ANY (${lowered}::text[]))
              ORDER BY position
            ),
            updated_at = now()
        WHERE workspace_id = ${workspaceId}::uuid AND id = ANY (${productIds}::uuid[])`,
    );
  }

  /** Moves every variant price by `percent`, rounded to cents and never below zero. */
  adjustPrices(workspaceId: string, productIds: string[], percent: number): Promise<number> {
    const factor = new Prisma.Decimal(PERCENT + percent).dividedBy(PERCENT);
    return this.updateAndPublish(workspaceId, productIds, async (tx) => {
      await tx.$executeRaw`
        UPDATE variants
        SET price = GREATEST(round(price * ${factor}::numeric, 2), 0),
            compare_at_price = CASE
              WHEN compare_at_price IS NULL THEN NULL
              ELSE GREATEST(round(compare_at_price * ${factor}::numeric, 2), 0)
            END,
            updated_at = now()
        WHERE workspace_id = ${workspaceId}::uuid AND product_id = ANY (${productIds}::uuid[])`;
      return tx.product.count({ where: { workspaceId, id: { in: productIds } } });
    });
  }

  delete(workspaceId: string, productIds: string[]): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const where = { workspaceId, id: { in: productIds } };
      const products = await tx.product.findMany({ where, select: { id: true, title: true } });
      const { count } = await tx.product.deleteMany({ where });
      await this.webhookEvents.deleted(tx, workspaceId, products);
      return count;
    });
  }

  /** Runs the write, then publishes `product.updated` for each product when any changed. */
  private updateAndPublish(
    workspaceId: string,
    productIds: string[],
    write: (tx: Transaction) => Promise<number>,
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const count = await write(tx);
      if (count > 0) await this.webhookEvents.updated(tx, workspaceId, productIds);
      return count;
    });
  }
}
