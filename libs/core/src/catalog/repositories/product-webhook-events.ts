import { Injectable } from '@nestjs/common';
import type { Prisma } from '@crossmart/database';
import type {
  DeletedProductEventData,
  ProductEventData,
} from '../../webhooks/entities/webhook-event-data.js';
import { WebhookEventType } from '../../webhooks/enums/webhook-event-type.enum.js';
import { WebhookOutbox } from '../../webhooks/services/webhook-outbox.js';

type Transaction = Prisma.TransactionClient;

/** A product about to be deleted, as `product.deleted` names it. */
export interface DeletedProductRef {
  id: string;
  title: string;
}

const PRODUCT_EVENT_SELECT = {
  id: true,
  title: true,
  handle: true,
  status: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

/**
 * Publishes `product.*` webhook events, one per product, in the transaction that wrote the
 * products. Each event carries the product as it is after the write.
 */
@Injectable()
export class ProductWebhookEvents {
  constructor(private readonly outbox: WebhookOutbox) {}

  async created(tx: Transaction, workspaceId: string, productIds: string[]): Promise<void> {
    await this.publishCurrent(tx, workspaceId, WebhookEventType.ProductCreated, productIds);
  }

  async updated(tx: Transaction, workspaceId: string, productIds: string[]): Promise<void> {
    await this.publishCurrent(tx, workspaceId, WebhookEventType.ProductUpdated, productIds);
  }

  async deleted(
    tx: Transaction,
    workspaceId: string,
    products: readonly DeletedProductRef[],
  ): Promise<void> {
    if (products.length === 0) return;
    await this.outbox.publish(tx, workspaceId, WebhookEventType.ProductDeleted, () =>
      Promise.resolve(
        products.map(({ id, title }): DeletedProductEventData => ({ product: { id, title } })),
      ),
    );
  }

  private async publishCurrent(
    tx: Transaction,
    workspaceId: string,
    type: WebhookEventType,
    productIds: string[],
  ): Promise<void> {
    if (productIds.length === 0) return;
    await this.outbox.publish(tx, workspaceId, type, async () => {
      const products = await tx.product.findMany({
        where: { workspaceId, id: { in: productIds } },
        select: PRODUCT_EVENT_SELECT,
        orderBy: { id: 'asc' },
      });
      return products.map(({ updatedAt, ...product }): ProductEventData => ({
        product: { ...product, updatedAt: updatedAt.toISOString() },
      }));
    });
  }
}
