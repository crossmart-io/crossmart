import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@crossmart/database';
import type { WebhookEventData } from '../entities/webhook-event-data.js';
import type { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import { WEBHOOK_API_VERSION } from '../webhooks.constants.js';

type Transaction = Prisma.TransactionClient;

/** Builds the events' data, one entry per event; called only when an endpoint listens. */
export type WebhookEventDataBuilder = () => Promise<WebhookEventData[]>;

interface OutboxEventRow {
  id: string;
  workspaceId: string;
  type: WebhookEventType;
  apiVersion: string;
  data: WebhookEventData;
  createdAt: Date;
}

/**
 * The transactional outbox of outgoing webhooks (ADR 0023). A service that changes something
 * calls `publish` inside the transaction that changes it: the event and one delivery per
 * subscribed endpoint commit or roll back with the change, so an event is never lost when the
 * process dies after the write, and never sent for a write that did not happen. The worker
 * sends the deliveries afterwards.
 */
@Injectable()
export class WebhookOutbox {
  /** Returns how many events were recorded: none when no enabled endpoint subscribes. */
  async publish(
    tx: Transaction,
    workspaceId: string,
    type: WebhookEventType,
    build: WebhookEventDataBuilder,
  ): Promise<number> {
    const endpointIds = await this.subscribers(tx, workspaceId, type);
    if (endpointIds.length === 0) return 0;
    const entries = await build();
    if (entries.length === 0) return 0;
    const now = new Date();
    const events: OutboxEventRow[] = entries.map((data) => ({
      id: randomUUID(),
      workspaceId,
      type,
      apiVersion: WEBHOOK_API_VERSION,
      data,
      createdAt: now,
    }));
    await tx.webhookEvent.createMany({ data: events });
    await tx.webhookDelivery.createMany({ data: this.deliveries(events, endpointIds, now) });
    return events.length;
  }

  /** Enabled endpoints of the workspace that subscribe to the type (indexed by workspace). */
  private async subscribers(
    tx: Transaction,
    workspaceId: string,
    type: WebhookEventType,
  ): Promise<string[]> {
    const endpoints = await tx.webhookEndpoint.findMany({
      where: { workspaceId, disabledReason: null, eventTypes: { has: type } },
      select: { id: true },
    });
    return endpoints.map((endpoint) => endpoint.id);
  }

  private deliveries(
    events: OutboxEventRow[],
    endpointIds: string[],
    now: Date,
  ): Prisma.WebhookDeliveryCreateManyInput[] {
    return events.flatMap((event) =>
      endpointIds.map((endpointId) => ({
        id: randomUUID(),
        workspaceId: event.workspaceId,
        eventId: event.id,
        endpointId,
        nextAttemptAt: now,
      })),
    );
  }
}
