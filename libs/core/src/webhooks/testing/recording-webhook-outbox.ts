import type { Prisma } from '@crossmart/database';
import type { WebhookEventData } from '../entities/webhook-event-data.js';
import type { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import type { WebhookEventDataBuilder } from '../services/webhook-outbox.js';
import { WebhookOutbox } from '../services/webhook-outbox.js';

/** A published event, as a test reads it. */
export interface PublishedWebhookEvent {
  workspaceId: string;
  type: WebhookEventType;
  data: WebhookEventData;
}

/** An outbox for unit tests: every endpoint listens, and events are kept in memory. */
export class RecordingWebhookOutbox extends WebhookOutbox {
  readonly published: PublishedWebhookEvent[] = [];

  override async publish(
    _tx: Prisma.TransactionClient,
    workspaceId: string,
    type: WebhookEventType,
    build: WebhookEventDataBuilder,
  ): Promise<number> {
    const entries = await build();
    this.published.push(...entries.map((data) => ({ workspaceId, type, data })));
    return entries.length;
  }
}
