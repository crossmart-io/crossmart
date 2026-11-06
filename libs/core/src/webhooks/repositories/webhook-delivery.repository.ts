import { randomUUID } from 'node:crypto';
import {
  type CountedRecords,
  SortDirection,
  sortWithTiebreak,
  toPageWindow,
} from '@crossmart/common';
import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService, WebhookDeliveryStatus } from '@crossmart/database';
import type { AttemptRecord, DeliveryRef } from '../entities/delivery-ref.js';
import type { WebhookDeliveryQuery } from '../entities/webhook-delivery-view.js';
import type { WebhookEventData } from '../entities/webhook-event-data.js';
import type { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import { WEBHOOK_API_VERSION } from '../webhooks.constants.js';
import {
  DELIVERY_DETAIL_INCLUDE,
  DELIVERY_ROW_INCLUDE,
  DELIVERY_TO_SEND_INCLUDE,
  type DeliveryDetailRow,
  type DeliveryRow,
  type DeliveryToSend,
} from './webhook-delivery.queries.js';

const PENDING_STATUSES = [WebhookDeliveryStatus.PENDING, WebhookDeliveryStatus.RETRYING];

/** Where a new delivery goes: an endpoint of the workspace, for an event already stored. */
export interface DeliveryTarget {
  workspaceId: string;
  endpointId: string;
  eventId: string;
}

/** An event made for one endpoint only, such as a test event. */
export interface DirectEvent {
  workspaceId: string;
  endpointId: string;
  type: WebhookEventType;
  data: WebhookEventData;
}

/** Deliveries: claiming due ones for the worker, recording attempts, and the delivery log. */
@Injectable()
export class WebhookDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Claims up to `limit` due deliveries until `leaseUntil`, oldest due first. Rows another
   * worker is claiming are skipped, and a claim whose lease ran out (its worker died) is taken.
   */
  claimDue(now: Date, leaseUntil: Date, limit: number): Promise<DeliveryRef[]> {
    return this.prisma.$queryRaw<DeliveryRef[]>`
      UPDATE webhook_deliveries AS delivery
      SET lease_expires_at = ${leaseUntil}
      FROM (
        SELECT id FROM webhook_deliveries
        WHERE status = ANY(${PENDING_STATUSES}::"WebhookDeliveryStatus"[])
          AND next_attempt_at <= ${now}
          AND (lease_expires_at IS NULL OR lease_expires_at < ${now})
        ORDER BY next_attempt_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      ) AS due
      WHERE delivery.id = due.id
      RETURNING delivery.id AS "deliveryId", delivery.attempts`;
  }

  /**
   * The delivery to send, if it is still waiting at the attempt it was claimed at; null when
   * it was settled or tried meanwhile. Renews the lease for this attempt.
   */
  async startAttempt(ref: DeliveryRef, leaseUntil: Date): Promise<DeliveryToSend | null> {
    const { count } = await this.prisma.webhookDelivery.updateMany({
      where: { id: ref.deliveryId, attempts: ref.attempts, status: { in: PENDING_STATUSES } },
      data: { leaseExpiresAt: leaseUntil },
    });
    if (count === 0) return null;
    return this.prisma.webhookDelivery.findUnique({
      where: { id: ref.deliveryId },
      include: DELIVERY_TO_SEND_INCLUDE,
    });
  }

  /** Stores an attempt's outcome, unless another attempt was recorded first. */
  async recordAttempt(ref: DeliveryRef, record: AttemptRecord): Promise<boolean> {
    const succeeded = record.status === WebhookDeliveryStatus.SUCCEEDED;
    const { count } = await this.prisma.webhookDelivery.updateMany({
      where: { id: ref.deliveryId, attempts: ref.attempts },
      data: {
        status: record.status,
        attempts: ref.attempts + 1,
        nextAttemptAt: record.nextAttemptAt,
        leaseExpiresAt: null,
        lastAttemptAt: record.attemptedAt,
        deliveredAt: succeeded ? record.attemptedAt : null,
        responseStatus: record.responseStatus,
        durationMs: record.durationMs,
        error: record.error,
      },
    });
    return count > 0;
  }

  /** A new delivery of a stored event, due now: a redelivery or a test event. */
  async create(target: DeliveryTarget, now: Date): Promise<DeliveryRow> {
    return this.prisma.webhookDelivery.create({
      data: { id: randomUUID(), ...target, nextAttemptAt: now },
      include: DELIVERY_ROW_INCLUDE,
    });
  }

  /** Stores an event for one endpoint and its delivery, due now, together. */
  createWithEvent(event: DirectEvent, now: Date): Promise<DeliveryRow> {
    const { workspaceId, endpointId, type, data } = event;
    const eventId = randomUUID();
    return this.prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: { id: eventId, workspaceId, type, apiVersion: WEBHOOK_API_VERSION, data },
      });
      return tx.webhookDelivery.create({
        data: { id: randomUUID(), workspaceId, endpointId, eventId, nextAttemptAt: now },
        include: DELIVERY_ROW_INCLUDE,
      });
    });
  }

  async listPage(
    workspaceId: string,
    endpointId: string,
    query: WebhookDeliveryQuery,
  ): Promise<CountedRecords<DeliveryRow>> {
    const where: Prisma.WebhookDeliveryWhereInput = {
      workspaceId,
      endpointId,
      status: query.status,
      ...(query.eventType ? { event: { type: query.eventType } } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.webhookDelivery.findMany({
        where,
        include: DELIVERY_ROW_INCLUDE,
        orderBy: sortWithTiebreak('createdAt', query.direction ?? SortDirection.Desc),
        ...toPageWindow(query),
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);
    return { records, total };
  }

  findDetail(
    workspaceId: string,
    endpointId: string,
    deliveryId: string,
  ): Promise<DeliveryDetailRow | null> {
    return this.prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, workspaceId, endpointId },
      include: DELIVERY_DETAIL_INCLUDE,
    });
  }

  /**
   * Deletes up to `limit` events created before `cutoff`, with their deliveries. An event with a
   * delivery still under way (a late redelivery) waits until it settles. Returns how many went,
   * so the caller repeats until fewer than `limit` do.
   */
  deleteEventsBefore(cutoff: Date, limit: number): Promise<number> {
    return this.prisma.$executeRaw`
      DELETE FROM webhook_events
      WHERE id IN (
        SELECT event.id FROM webhook_events AS event
        WHERE event.created_at < ${cutoff}
          AND NOT EXISTS (
            SELECT 1 FROM webhook_deliveries AS delivery
            WHERE delivery.event_id = event.id
              AND delivery.status = ANY(${PENDING_STATUSES}::"WebhookDeliveryStatus"[])
          )
        LIMIT ${limit}
      )`;
  }
}
