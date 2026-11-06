import { Injectable } from '@nestjs/common';
import type { Prisma } from '@crossmart/database';
import type { ListingEventData } from '../../webhooks/entities/webhook-event-data.js';
import type { WebhookEventType } from '../../webhooks/enums/webhook-event-type.enum.js';
import { WebhookOutbox } from '../../webhooks/services/webhook-outbox.js';

type Transaction = Prisma.TransactionClient;

/** A listing to announce, within its workspace. */
export interface AnnouncedListing {
  workspaceId: string;
  listingId: string;
}

const LISTING_EVENT_SELECT = {
  id: true,
  productId: true,
  connectionId: true,
  status: true,
  externalId: true,
  externalUrl: true,
  lastError: true,
  connection: { select: { channel: true } },
} satisfies Prisma.ListingSelect;

/** Publishes `listing.*` webhook events with the listing as the write left it. */
@Injectable()
export class ListingWebhookEvents {
  constructor(private readonly outbox: WebhookOutbox) {}

  async publish(tx: Transaction, listing: AnnouncedListing, type: WebhookEventType): Promise<void> {
    await this.outbox.publish(tx, listing.workspaceId, type, async () => {
      const row = await tx.listing.findFirst({
        where: { id: listing.listingId, workspaceId: listing.workspaceId },
        select: LISTING_EVENT_SELECT,
      });
      if (!row) return [];
      const { connection, ...fields } = row;
      const data: ListingEventData = { listing: { ...fields, channel: connection.channel } };
      return [data];
    });
  }
}
